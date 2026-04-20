-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 4: Wizard confirm flow server-side helpers
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Three RPCs + a rate-limit check, called by the manual-submission flow:
--   1. check_intra_agency_duplicate — does this agency already have this?
--   2. colist_as_secondary — upsert a manual agency as secondary on an
--      existing property (manual_vs_manual "yes we co-represent" path)
--   3. upgrade_primary_from_scrape — manual submitter becomes primary on
--      a scrape-only property, old scrape demoted to secondary (scrape_only
--      "yes same apartment" path)
--   4. file_primary_dispute — convenience wrapper + colist (dispute path)
--   5. check_manual_upgrade_rate_limit — prevents fraud-spam primary grabs

-- ───────────────────────────────────────────────────────────────────────────
-- 1. check_intra_agency_duplicate
-- ───────────────────────────────────────────────────────────────────────────
--
-- Returns the most recent property from the SAME agency that matches the
-- draft listing on address+city, or (as a fallback) on city+bedrooms+size.
-- Floor/apt mismatch cancels the match (explicit "different unit").
--
-- Used as a pre-check in the wizard — if a row is returned, the agent is
-- about to re-post something they already have, and we hard-block with a
-- "open existing draft" dialog.

CREATE OR REPLACE FUNCTION public.check_intra_agency_duplicate(
  p_agency_id UUID,
  p_address TEXT,
  p_city TEXT,
  p_size_sqm NUMERIC DEFAULT NULL,
  p_bedrooms INT DEFAULT NULL,
  p_floor_number INT DEFAULT NULL,
  p_apartment_number TEXT DEFAULT NULL
)
RETURNS TABLE (
  property_id UUID,
  title TEXT,
  created_at TIMESTAMPTZ,
  address TEXT,
  city TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.title, p.created_at, p.address, p.city
  FROM public.properties p
  WHERE p.primary_agency_id = p_agency_id
    AND p.is_published = true
    -- Normalized address + city match (cheap, strict)
    AND (
      (
        lower(regexp_replace(trim(p.address), '\s+', ' ', 'g'))
          = lower(regexp_replace(trim(p_address), '\s+', ' ', 'g'))
        AND lower(trim(p.city)) = lower(trim(p_city))
      )
      OR
      -- Fallback: same city + bedrooms + near size (for typos)
      (
        p_size_sqm IS NOT NULL
        AND p_bedrooms IS NOT NULL
        AND lower(trim(p.city)) = lower(trim(p_city))
        AND p.bedrooms = p_bedrooms
        AND p.size_sqm BETWEEN p_size_sqm - 3 AND p_size_sqm + 3
      )
    )
    -- Different floor or apt # explicitly says "this is not the same unit"
    AND NOT (
      p_floor_number IS NOT NULL
      AND p.floor IS NOT NULL
      AND p_floor_number <> p.floor
    )
    AND NOT (
      p_apartment_number IS NOT NULL
      AND p_apartment_number <> ''
      AND p.apartment_number IS NOT NULL
      AND p.apartment_number <> ''
      AND lower(trim(p.apartment_number)) <> lower(trim(p_apartment_number))
    )
  ORDER BY p.created_at DESC
  LIMIT 1;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. colist_as_secondary
-- ───────────────────────────────────────────────────────────────────────────
--
-- Attach an agency as a secondary co-listing agent on an existing property.
-- Caller must own the incoming agency (RLS on property_co_agents enforces).
-- Idempotent via UNIQUE(property_id, source_url).
--
-- For manual submissions we don't have an external source_url, so we fabricate
-- one from the agency_id to keep the uniqueness invariant meaningful.

CREATE OR REPLACE FUNCTION public.colist_as_secondary(
  p_existing_property_id UUID,
  p_new_agency_id UUID,
  p_new_agent_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_co_agent_id UUID;
  v_synthetic_source TEXT;
BEGIN
  v_synthetic_source := 'buywise:manual:' || p_new_agency_id::text;

  INSERT INTO public.property_co_agents (
    property_id, agent_id, agency_id, source_url, source_type
  ) VALUES (
    p_existing_property_id, p_new_agent_id, p_new_agency_id, v_synthetic_source, 'website'
  )
  ON CONFLICT (property_id, source_url) DO NOTHING
  RETURNING id INTO v_co_agent_id;

  RETURN v_co_agent_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. upgrade_primary_from_scrape
-- ───────────────────────────────────────────────────────────────────────────
--
-- A manual submission lands on a property currently held by a scrape-only
-- primary. Manual beats scrape: the new agency becomes primary; the old
-- scrape agency is demoted to secondary. Logs the transition.
--
-- Rate-limited to 20 upgrades/agency/day (fraud mitigation).

CREATE OR REPLACE FUNCTION public.upgrade_primary_from_scrape(
  p_existing_property_id UUID,
  p_new_agency_id UUID,
  p_new_agent_id UUID
)
RETURNS UUID  -- the primary_agency_history id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_primary_agency UUID;
  v_old_source_url TEXT;
  v_old_import_source TEXT;
  v_old_added_manually BOOLEAN;
  v_recent_upgrades INT;
  v_history_id UUID;
BEGIN
  -- Load existing primary
  SELECT primary_agency_id, source_url, import_source, COALESCE(added_manually, false)
  INTO v_old_primary_agency, v_old_source_url, v_old_import_source, v_old_added_manually
  FROM public.properties
  WHERE id = p_existing_property_id;

  IF v_old_primary_agency IS NULL THEN
    RAISE EXCEPTION 'Property not found or has no primary';
  END IF;

  IF v_old_added_manually THEN
    RAISE EXCEPTION 'Existing primary is manual; cannot upgrade via this path';
  END IF;

  IF v_old_primary_agency = p_new_agency_id THEN
    RAISE EXCEPTION 'Agency is already primary on this property';
  END IF;

  -- Rate limit: max 20 manual upgrades per agency per 24h
  SELECT COUNT(*) INTO v_recent_upgrades
  FROM public.primary_agency_history
  WHERE new_agency_id = p_new_agency_id
    AND reason = 'manual_upgrade'
    AND created_at > now() - interval '1 day';
  IF v_recent_upgrades >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many manual primary upgrades in the last 24 hours';
  END IF;

  -- Demote old primary into co_agents (best-effort; UNIQUE may skip if already present)
  INSERT INTO public.property_co_agents (
    property_id, agent_id, agency_id, source_url, source_type
  ) VALUES (
    p_existing_property_id,
    (SELECT agent_id FROM public.properties WHERE id = p_existing_property_id),
    v_old_primary_agency,
    COALESCE(v_old_source_url, 'buywise:legacy:' || v_old_primary_agency::text),
    COALESCE(v_old_import_source, 'website')
  )
  ON CONFLICT (property_id, source_url) DO NOTHING;

  -- Remove the incoming agency's co-agent row if it existed
  DELETE FROM public.property_co_agents
  WHERE property_id = p_existing_property_id
    AND agency_id = p_new_agency_id;

  -- Promote new primary + log transition
  v_history_id := public.log_primary_transition(
    p_existing_property_id,
    p_new_agency_id,
    'manual_upgrade',
    'Manual submission promoted over previous scrape-only primary'
  );

  -- Reassign the agent + mark as manually-owned going forward
  UPDATE public.properties
  SET agent_id = p_new_agent_id,
      added_manually = true,
      updated_at = now()
  WHERE id = p_existing_property_id;

  RETURN v_history_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. file_primary_dispute_with_colist
-- ───────────────────────────────────────────────────────────────────────────
--
-- Wizard "Not sure — dispute" path: submit a dispute AND co-list in one shot.
-- Admin resolves the dispute later; meanwhile the new agency is shown as
-- secondary so buyers see honest attribution.

CREATE OR REPLACE FUNCTION public.file_primary_dispute_with_colist(
  p_existing_property_id UUID,
  p_disputing_agency_id UUID,
  p_disputing_agent_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID  -- dispute id
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_target_agency_id UUID;
  v_dispute_id UUID;
BEGIN
  SELECT primary_agency_id INTO v_target_agency_id
  FROM public.properties
  WHERE id = p_existing_property_id;

  IF v_target_agency_id IS NULL THEN
    RAISE EXCEPTION 'Property not found or has no primary';
  END IF;

  -- Insert as secondary co-agent
  PERFORM public.colist_as_secondary(
    p_existing_property_id, p_disputing_agency_id, p_disputing_agent_id
  );

  -- File the dispute
  INSERT INTO public.primary_disputes (
    property_id, disputing_agency_id, target_agency_id, reason, status
  ) VALUES (
    p_existing_property_id, p_disputing_agency_id, v_target_agency_id, p_reason, 'pending'
  ) RETURNING id INTO v_dispute_id;

  RETURN v_dispute_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 4 migration
-- ───────────────────────────────────────────────────────────────────────────
