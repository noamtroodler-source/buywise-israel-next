-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 3: Wizard confirm flow server-side helpers
-- ═══════════════════════════════════════════════════════════════════════════

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
    AND (
      (
        lower(regexp_replace(trim(p.address), '\s+', ' ', 'g'))
          = lower(regexp_replace(trim(p_address), '\s+', ' ', 'g'))
        AND lower(trim(p.city)) = lower(trim(p_city))
      )
      OR
      (
        p_size_sqm IS NOT NULL
        AND p_bedrooms IS NOT NULL
        AND lower(trim(p.city)) = lower(trim(p_city))
        AND p.bedrooms = p_bedrooms
        AND p.size_sqm BETWEEN p_size_sqm - 3 AND p_size_sqm + 3
      )
    )
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

CREATE OR REPLACE FUNCTION public.upgrade_primary_from_scrape(
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
  v_old_primary_agency UUID;
  v_old_source_url TEXT;
  v_old_import_source TEXT;
  v_old_added_manually BOOLEAN;
  v_recent_upgrades INT;
  v_history_id UUID;
BEGIN
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

  SELECT COUNT(*) INTO v_recent_upgrades
  FROM public.primary_agency_history
  WHERE new_agency_id = p_new_agency_id
    AND reason = 'manual_upgrade'
    AND created_at > now() - interval '1 day';
  IF v_recent_upgrades >= 20 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many manual primary upgrades in the last 24 hours';
  END IF;

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

  DELETE FROM public.property_co_agents
  WHERE property_id = p_existing_property_id
    AND agency_id = p_new_agency_id;

  v_history_id := public.log_primary_transition(
    p_existing_property_id,
    p_new_agency_id,
    'manual_upgrade',
    'Manual submission promoted over previous scrape-only primary'
  );

  UPDATE public.properties
  SET agent_id = p_new_agent_id,
      added_manually = true,
      updated_at = now()
  WHERE id = p_existing_property_id;

  RETURN v_history_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.file_primary_dispute_with_colist(
  p_existing_property_id UUID,
  p_disputing_agency_id UUID,
  p_disputing_agent_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS UUID
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

  PERFORM public.colist_as_secondary(
    p_existing_property_id, p_disputing_agency_id, p_disputing_agent_id
  );

  INSERT INTO public.primary_disputes (
    property_id, disputing_agency_id, target_agency_id, reason, status
  ) VALUES (
    p_existing_property_id, p_disputing_agency_id, v_target_agency_id, p_reason, 'pending'
  ) RETURNING id INTO v_dispute_id;

  RETURN v_dispute_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 4: Admin tooling RPCs
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.resolve_primary_dispute(
  p_dispute_id UUID,
  p_resolution TEXT,
  p_admin_notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dispute RECORD;
  v_is_admin BOOLEAN;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  IF p_resolution NOT IN ('resolved_uphold', 'resolved_dismiss') THEN
    RAISE EXCEPTION 'Invalid resolution: %', p_resolution;
  END IF;

  SELECT id, property_id, disputing_agency_id, target_agency_id, status
  INTO v_dispute
  FROM public.primary_disputes
  WHERE id = p_dispute_id;

  IF v_dispute.id IS NULL THEN
    RAISE EXCEPTION 'Dispute not found: %', p_dispute_id;
  END IF;

  IF v_dispute.status <> 'pending' THEN
    RAISE EXCEPTION 'Dispute already resolved (status: %)', v_dispute.status;
  END IF;

  UPDATE public.primary_disputes
  SET status = p_resolution,
      resolved_by = auth.uid(),
      resolved_at = now(),
      admin_notes = p_admin_notes
  WHERE id = p_dispute_id;

  IF p_resolution = 'resolved_uphold' THEN
    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT v_dispute.property_id,
           (SELECT agent_id FROM public.properties WHERE id = v_dispute.property_id),
           v_dispute.target_agency_id,
           'buywise:dispute-demoted:' || v_dispute.target_agency_id::text,
           'website'
    WHERE v_dispute.target_agency_id IS NOT NULL
    ON CONFLICT (property_id, source_url) DO NOTHING;

    DELETE FROM public.property_co_agents
    WHERE property_id = v_dispute.property_id
      AND agency_id = v_dispute.disputing_agency_id;

    PERFORM public.log_primary_transition(
      v_dispute.property_id,
      v_dispute.disputing_agency_id,
      'dispute_resolution',
      COALESCE(p_admin_notes, 'Dispute upheld by admin')
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_override_primary(
  p_property_id UUID,
  p_new_agency_id UUID,
  p_reason_note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_old_primary_agency UUID;
  v_history_id UUID;
BEGIN
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  SELECT primary_agency_id INTO v_old_primary_agency
  FROM public.properties
  WHERE id = p_property_id;

  IF v_old_primary_agency IS NULL THEN
    RAISE EXCEPTION 'Property not found: %', p_property_id;
  END IF;

  IF v_old_primary_agency = p_new_agency_id THEN
    RAISE EXCEPTION 'Agency is already primary on this property';
  END IF;

  INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
  SELECT p_property_id,
         (SELECT agent_id FROM public.properties WHERE id = p_property_id),
         v_old_primary_agency,
         'buywise:admin-demoted:' || v_old_primary_agency::text,
         'website'
  ON CONFLICT (property_id, source_url) DO NOTHING;

  DELETE FROM public.property_co_agents
  WHERE property_id = p_property_id
    AND agency_id = p_new_agency_id;

  v_history_id := public.log_primary_transition(
    p_property_id,
    p_new_agency_id,
    'admin_override',
    COALESCE(p_reason_note, 'Manual admin override')
  );

  RETURN v_history_id;
END;
$$;