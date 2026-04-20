-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 7: Boost = primary-slot mechanic
-- ═══════════════════════════════════════════════════════════════════════════
--
-- When an agency activates a featured listing on a co-listed property where
-- they're secondary, the boost temporarily promotes them to primary. When
-- the featured period ends (or is cancelled), primary reverts to whoever
-- held it before the boost.
--
-- Uses the Phase 1 columns on properties:
--   boost_active_until, boosted_by_agency_id
--
-- The actual "paid vs free credit" bookkeeping stays in featured_listings
-- exactly as today; these RPCs layer the primary-slot swap on top.

-- ───────────────────────────────────────────────────────────────────────────
-- start_primary_boost — call after activating a featured listing
-- ───────────────────────────────────────────────────────────────────────────
--
-- Idempotent: if the agency is already primary, sets the boost columns but
-- logs no transition (they keep their slot with boost duration recorded).
-- If they're secondary, demotes the current primary and promotes them;
-- logs 'boost_start' via log_primary_transition().

CREATE OR REPLACE FUNCTION public.start_primary_boost(
  p_property_id UUID,
  p_agency_id UUID,
  p_agent_id UUID DEFAULT NULL,
  p_duration_days INT DEFAULT 30
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_primary UUID;
  v_old_primary_source TEXT;
  v_new_deadline TIMESTAMPTZ;
  v_resolved_agent UUID := p_agent_id;
BEGIN
  -- If no agent passed, prefer the agency's co-agent row for this property,
  -- fall back to any agent in the agency.
  IF v_resolved_agent IS NULL THEN
    SELECT agent_id INTO v_resolved_agent
    FROM public.property_co_agents
    WHERE property_id = p_property_id AND agency_id = p_agency_id
    LIMIT 1;
  END IF;
  IF v_resolved_agent IS NULL THEN
    SELECT id INTO v_resolved_agent
    FROM public.agents
    WHERE agency_id = p_agency_id
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  SELECT primary_agency_id, source_url
  INTO v_current_primary, v_old_primary_source
  FROM public.properties
  WHERE id = p_property_id;

  IF v_current_primary IS NULL THEN
    RAISE EXCEPTION 'Property not found or has no primary';
  END IF;

  v_new_deadline := now() + (p_duration_days || ' days')::interval;

  -- Already primary: just set boost columns (keep existing expiry if later)
  IF v_current_primary = p_agency_id THEN
    UPDATE public.properties
    SET boost_active_until = GREATEST(COALESCE(boost_active_until, now()), v_new_deadline),
        boosted_by_agency_id = p_agency_id,
        updated_at = now()
    WHERE id = p_property_id;
    RETURN;
  END IF;

  -- Secondary path: promote. First, park old primary as a co-agent.
  INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
  SELECT p_property_id,
         (SELECT agent_id FROM public.properties WHERE id = p_property_id),
         v_current_primary,
         COALESCE(v_old_primary_source, 'buywise:boost-demoted:' || v_current_primary::text),
         'website'
  ON CONFLICT (property_id, source_url) DO NOTHING;

  -- Remove new primary's co-agent row (they're stepping up)
  DELETE FROM public.property_co_agents
  WHERE property_id = p_property_id
    AND agency_id = p_agency_id;

  -- Swap primary + log
  PERFORM public.log_primary_transition(
    p_property_id,
    p_agency_id,
    'boost_start',
    'Featured boost activated for ' || p_duration_days || ' days'
  );

  -- Apply boost metadata + agent reassignment (fall back to existing if nothing resolved)
  UPDATE public.properties
  SET agent_id = COALESCE(v_resolved_agent, agent_id),
      boost_active_until = v_new_deadline,
      boosted_by_agency_id = p_agency_id,
      updated_at = now()
  WHERE id = p_property_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- end_primary_boost — call when featured listing is cancelled
-- ───────────────────────────────────────────────────────────────────────────
--
-- If the caller is currently holding the boost on this property, clear the
-- boost columns. If this was a secondary→primary promotion (recorded via
-- 'boost_start' in history), revert primary to the immediately-previous
-- holder and log 'boost_end'. If they were already primary before the
-- boost, just clear the boost columns — no transition.

CREATE OR REPLACE FUNCTION public.end_primary_boost(
  p_property_id UUID,
  p_agency_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_primary UUID;
  v_boost_holder UUID;
  v_last_reason TEXT;
  v_prev_agency UUID;
  v_prev_agent UUID;
BEGIN
  SELECT primary_agency_id, boosted_by_agency_id
  INTO v_current_primary, v_boost_holder
  FROM public.properties
  WHERE id = p_property_id;

  IF v_current_primary IS NULL THEN
    RETURN; -- property deleted; nothing to do
  END IF;

  -- No boost to end
  IF v_boost_holder IS NULL OR v_boost_holder <> p_agency_id THEN
    RETURN;
  END IF;

  -- Look up whether the last primary transition was a boost_start FROM this agency
  SELECT reason, previous_agency_id
  INTO v_last_reason, v_prev_agency
  FROM public.primary_agency_history
  WHERE property_id = p_property_id
    AND new_agency_id = p_agency_id
  ORDER BY created_at DESC
  LIMIT 1;

  -- Clear boost columns unconditionally
  UPDATE public.properties
  SET boost_active_until = NULL,
      boosted_by_agency_id = NULL,
      updated_at = now()
  WHERE id = p_property_id;

  -- If the last transition into this agency was a boost_start AND there's
  -- a previous holder to revert to, revert primary now.
  IF v_last_reason = 'boost_start' AND v_prev_agency IS NOT NULL AND v_prev_agency <> p_agency_id THEN
    -- Put boost holder back as secondary
    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT p_property_id,
           (SELECT agent_id FROM public.properties WHERE id = p_property_id),
           p_agency_id,
           'buywise:boost-expired:' || p_agency_id::text,
           'website'
    ON CONFLICT (property_id, source_url) DO NOTHING;

    -- Remove previous primary's co-agent row (they're returning to primary)
    DELETE FROM public.property_co_agents
    WHERE property_id = p_property_id
      AND agency_id = v_prev_agency;

    -- Look up previous agent if we can
    SELECT agent_id INTO v_prev_agent
    FROM public.property_co_agents
    WHERE property_id = p_property_id AND agency_id = v_prev_agency
    LIMIT 1;

    PERFORM public.log_primary_transition(
      p_property_id,
      v_prev_agency,
      'boost_end',
      'Featured boost ended; primary restored'
    );

    IF v_prev_agent IS NOT NULL THEN
      UPDATE public.properties SET agent_id = v_prev_agent WHERE id = p_property_id;
    END IF;
  END IF;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- colisting_boost_expiry_sweep — nightly sweep for expired boosts
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.colisting_boost_expiry_sweep()
RETURNS TABLE (property_id UUID, expired_agency_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.id, p.boosted_by_agency_id
    FROM public.properties p
    WHERE p.boost_active_until IS NOT NULL
      AND p.boost_active_until < now()
      AND p.boosted_by_agency_id IS NOT NULL
  LOOP
    PERFORM public.end_primary_boost(r.id, r.boosted_by_agency_id);

    -- Also deactivate the featured_listings row, if any (keeps the two in sync).
    UPDATE public.featured_listings
    SET is_active = false, cancelled_at = now()
    WHERE property_id = r.id
      AND agency_id = r.boosted_by_agency_id
      AND is_active = true;

    property_id := r.id;
    expired_agency_id := r.boosted_by_agency_id;
    RETURN NEXT;
  END LOOP;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- get_agency_primary_listing_count — tier-counting helper
-- ───────────────────────────────────────────────────────────────────────────
--
-- Single source of truth for "how many primary listings does this agency
-- have right now" — used by tier-gated limits. Excludes properties where
-- the agency only appears as a secondary co-agent, and excludes properties
-- where another agency currently holds a boost (temporarily primary).

CREATE OR REPLACE FUNCTION public.get_agency_primary_listing_count(p_agency_id UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INT;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM public.properties
  WHERE primary_agency_id = p_agency_id
    AND is_published = true
    -- Exclude properties where someone ELSE is boost-holding primary right now
    AND (
      boost_active_until IS NULL
      OR boost_active_until < now()
      OR boosted_by_agency_id = p_agency_id
    );
  RETURN COALESCE(v_count, 0);
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 7 migration
-- ───────────────────────────────────────────────────────────────────────────
