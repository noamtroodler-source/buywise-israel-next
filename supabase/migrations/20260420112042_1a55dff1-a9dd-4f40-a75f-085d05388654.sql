-- ============================================================================
-- Phase 5 — Boost mechanic
-- ============================================================================

-- Tier-counting source of truth: only properties where this agency is primary
CREATE OR REPLACE FUNCTION public.get_agency_primary_listing_count(
  p_agency_id uuid
) RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM public.properties
  WHERE primary_agency_id = p_agency_id
    AND is_published = true
    AND listing_status IN ('for_sale', 'for_rent');
$$;

-- ----------------------------------------------------------------------------
-- start_primary_boost: temporarily promote a secondary agency to primary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_primary_boost(
  p_property_id uuid,
  p_boosting_agency_id uuid,
  p_boosting_agent_id uuid,
  p_duration_days integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_primary uuid;
  v_current_agent uuid;
  v_is_co_agent boolean;
  v_boost_until timestamptz;
BEGIN
  -- Validate property + lock row
  SELECT primary_agency_id, agent_id
    INTO v_current_primary, v_current_agent
  FROM public.properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'P0002';
  END IF;

  -- If boosting agency is already primary, just extend the boost window
  IF v_current_primary = p_boosting_agency_id THEN
    v_boost_until := now() + (p_duration_days || ' days')::interval;
    UPDATE public.properties
    SET boost_active_until = v_boost_until,
        boosted_by_agency_id = p_boosting_agency_id,
        last_primary_refresh = now()
    WHERE id = p_property_id;
    RETURN jsonb_build_object(
      'status', 'extended',
      'boost_active_until', v_boost_until
    );
  END IF;

  -- Verify boosting agency is a co-listed secondary on this property
  SELECT EXISTS (
    SELECT 1 FROM public.property_co_agents
    WHERE property_id = p_property_id
      AND agency_id = p_boosting_agency_id
  ) INTO v_is_co_agent;

  IF NOT v_is_co_agent THEN
    RAISE EXCEPTION 'Agency is not a co-listed agent on this property'
      USING ERRCODE = 'P0001';
  END IF;

  v_boost_until := now() + (p_duration_days || ' days')::interval;

  -- Swap primary
  UPDATE public.properties
  SET primary_agency_id = p_boosting_agency_id,
      agent_id = p_boosting_agent_id,
      boost_active_until = v_boost_until,
      boosted_by_agency_id = p_boosting_agency_id,
      last_primary_refresh = now(),
      updated_at = now()
  WHERE id = p_property_id;

  -- Log transition
  PERFORM public.log_primary_transition(
    p_property_id,
    v_current_primary,
    p_boosting_agency_id,
    'boost_start',
    p_boosting_agent_id,
    jsonb_build_object(
      'duration_days', p_duration_days,
      'boost_active_until', v_boost_until,
      'previous_agent_id', v_current_agent
    )
  );

  RETURN jsonb_build_object(
    'status', 'boosted',
    'previous_primary_agency_id', v_current_primary,
    'boost_active_until', v_boost_until
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- end_primary_boost: restore the prior primary (initial version, no notify)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.end_primary_boost(
  p_property_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_boosted_by uuid;
  v_current_primary uuid;
  v_prior_primary uuid;
  v_prior_agent uuid;
BEGIN
  SELECT primary_agency_id, boosted_by_agency_id
    INTO v_current_primary, v_boosted_by
  FROM public.properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_boosted_by IS NULL THEN
    RETURN jsonb_build_object('status', 'no_active_boost');
  END IF;

  -- Find the most recent non-boost primary before this boost
  SELECT to_agency_id, to_agent_id
    INTO v_prior_primary, v_prior_agent
  FROM public.primary_agency_history
  WHERE property_id = p_property_id
    AND reason <> 'boost_start'
  ORDER BY transitioned_at DESC
  LIMIT 1;

  -- Fall back: pick another co-listed agency, or null
  IF v_prior_primary IS NULL THEN
    SELECT agency_id, agent_id INTO v_prior_primary, v_prior_agent
    FROM public.property_co_agents
    WHERE property_id = p_property_id
      AND agency_id <> v_current_primary
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  UPDATE public.properties
  SET primary_agency_id = v_prior_primary,
      agent_id = COALESCE(v_prior_agent, agent_id),
      boost_active_until = NULL,
      boosted_by_agency_id = NULL,
      updated_at = now()
  WHERE id = p_property_id;

  PERFORM public.log_primary_transition(
    p_property_id,
    v_current_primary,
    v_prior_primary,
    'boost_end',
    NULL,
    jsonb_build_object('boost_ended_at', now())
  );

  RETURN jsonb_build_object(
    'status', 'boost_ended',
    'restored_primary_agency_id', v_prior_primary
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- colisting_boost_expiry_sweep: end all boosts whose window has lapsed
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.colisting_boost_expiry_sweep()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id uuid;
  v_count integer := 0;
BEGIN
  FOR v_property_id IN
    SELECT id FROM public.properties
    WHERE boost_active_until IS NOT NULL
      AND boost_active_until <= now()
  LOOP
    PERFORM public.end_primary_boost(v_property_id);
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('boosts_ended', v_count, 'swept_at', now());
END;
$$;

-- Indexes for sweep performance
CREATE INDEX IF NOT EXISTS idx_properties_boost_expiry
  ON public.properties(boost_active_until)
  WHERE boost_active_until IS NOT NULL;