-- ============================================================================
-- Phase 6 — Notifications (triggers + boost warning sweep + end_primary_boost v2)
-- ============================================================================

-- ---------- Helper: insert agency notification --------------------------------
CREATE OR REPLACE FUNCTION public.create_agency_notification(
  p_agency_id uuid,
  p_type text,
  p_title text,
  p_message text,
  p_action_url text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_agency_id IS NULL THEN RETURN; END IF;
  INSERT INTO public.agency_notifications (agency_id, type, title, message, action_url, is_read)
  VALUES (p_agency_id, p_type, p_title, p_message, p_action_url, false);
END;
$$;

-- ---------- Trigger: primary transition notifications -------------------------
CREATE OR REPLACE FUNCTION public.notify_primary_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_title text;
  v_action_url text;
BEGIN
  SELECT title INTO v_property_title FROM public.properties WHERE id = NEW.property_id;
  v_action_url := '/agency/listings/' || NEW.property_id::text;

  -- Notify the OLD primary (lost primary)
  IF NEW.from_agency_id IS NOT NULL AND NEW.from_agency_id <> COALESCE(NEW.to_agency_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    PERFORM public.create_agency_notification(
      NEW.from_agency_id,
      'primary_lost',
      CASE NEW.reason
        WHEN 'boost_start'        THEN 'Another agency boosted this listing'
        WHEN 'manual_upgrade'     THEN 'A manual listing claimed primary'
        WHEN 'dispute_resolved'   THEN 'Primary status reassigned by dispute'
        WHEN 'admin_override'     THEN 'Admin reassigned primary'
        ELSE 'Primary status changed'
      END,
      'Property "' || COALESCE(v_property_title, 'Untitled') || '" — you are now a co-listing agency.',
      v_action_url
    );
  END IF;

  -- Notify the NEW primary (gained primary)
  IF NEW.to_agency_id IS NOT NULL AND NEW.to_agency_id <> COALESCE(NEW.from_agency_id, '00000000-0000-0000-0000-000000000000'::uuid) THEN
    PERFORM public.create_agency_notification(
      NEW.to_agency_id,
      'primary_gained',
      CASE NEW.reason
        WHEN 'boost_start'        THEN 'Your boost is now active — you are primary'
        WHEN 'manual_upgrade'     THEN 'You are now primary on this listing'
        WHEN 'dispute_resolved'   THEN 'Primary status awarded via dispute'
        WHEN 'admin_override'     THEN 'Admin set you as primary'
        WHEN 'boost_end'          THEN 'Boost ended — primary restored'
        ELSE 'You are now primary on this listing'
      END,
      'Property "' || COALESCE(v_property_title, 'Untitled') || '" — you now own the primary contact card.',
      v_action_url
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_primary_transition ON public.primary_agency_history;
CREATE TRIGGER trg_notify_primary_transition
AFTER INSERT ON public.primary_agency_history
FOR EACH ROW EXECUTE FUNCTION public.notify_primary_transition();

-- ---------- Trigger: primary dispute notifications ----------------------------
CREATE OR REPLACE FUNCTION public.notify_primary_dispute()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_agency uuid;
  v_property_title text;
  v_action_url text;
BEGIN
  SELECT primary_agency_id, title
    INTO v_existing_agency, v_property_title
  FROM public.properties
  WHERE id = NEW.property_id;

  v_action_url := '/agency/disputes/' || NEW.id::text;

  IF TG_OP = 'INSERT' THEN
    -- Notify defending (existing primary) agency
    IF v_existing_agency IS NOT NULL AND v_existing_agency <> NEW.disputing_agency_id THEN
      PERFORM public.create_agency_notification(
        v_existing_agency,
        'dispute_filed_against_you',
        'A primary dispute has been filed',
        'Another agency has disputed your primary status on "' || COALESCE(v_property_title, 'Untitled') || '". Please respond.',
        v_action_url
      );
    END IF;
    -- Confirm to the disputing agency
    PERFORM public.create_agency_notification(
      NEW.disputing_agency_id,
      'dispute_filed_by_you',
      'Dispute submitted',
      'Your primary dispute on "' || COALESCE(v_property_title, 'Untitled') || '" is under admin review.',
      v_action_url
    );

  ELSIF TG_OP = 'UPDATE' AND NEW.status <> OLD.status AND NEW.status IN ('upheld', 'rejected') THEN
    -- Notify both parties of the decision
    PERFORM public.create_agency_notification(
      NEW.disputing_agency_id,
      'dispute_resolved',
      CASE NEW.status
        WHEN 'upheld'   THEN 'Dispute upheld — you are now primary'
        WHEN 'rejected' THEN 'Dispute rejected'
      END,
      'Decision on "' || COALESCE(v_property_title, 'Untitled') || '"' ||
        COALESCE(': ' || NEW.resolution_notes, ''),
      v_action_url
    );
    IF v_existing_agency IS NOT NULL AND v_existing_agency <> NEW.disputing_agency_id THEN
      PERFORM public.create_agency_notification(
        v_existing_agency,
        'dispute_resolved',
        CASE NEW.status
          WHEN 'upheld'   THEN 'You lost primary — dispute upheld'
          WHEN 'rejected' THEN 'Dispute against you was rejected'
        END,
        'Decision on "' || COALESCE(v_property_title, 'Untitled') || '"' ||
          COALESCE(': ' || NEW.resolution_notes, ''),
        v_action_url
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_primary_dispute_insert ON public.primary_disputes;
CREATE TRIGGER trg_notify_primary_dispute_insert
AFTER INSERT ON public.primary_disputes
FOR EACH ROW EXECUTE FUNCTION public.notify_primary_dispute();

DROP TRIGGER IF EXISTS trg_notify_primary_dispute_update ON public.primary_disputes;
CREATE TRIGGER trg_notify_primary_dispute_update
AFTER UPDATE ON public.primary_disputes
FOR EACH ROW EXECUTE FUNCTION public.notify_primary_dispute();

-- ---------- Boost warning sweep: 3 days before expiry -------------------------
CREATE OR REPLACE FUNCTION public.colisting_boost_warning_sweep()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_count integer := 0;
BEGIN
  FOR v_row IN
    SELECT id, title, boosted_by_agency_id, boost_active_until
    FROM public.properties
    WHERE boosted_by_agency_id IS NOT NULL
      AND boost_active_until IS NOT NULL
      AND boost_active_until BETWEEN now() + interval '3 days' AND now() + interval '4 days'
  LOOP
    PERFORM public.create_agency_notification(
      v_row.boosted_by_agency_id,
      'boost_expiring_soon',
      'Your boost expires in 3 days',
      'Boost on "' || COALESCE(v_row.title, 'Untitled') || '" ends ' || to_char(v_row.boost_active_until, 'Mon DD, YYYY') || '. Renew to keep primary status.',
      '/agency/featured'
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN jsonb_build_object('warnings_sent', v_count, 'swept_at', now());
END;
$$;

-- ---------- end_primary_boost v2: notifies the boosting agency ----------------
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
  v_property_title text;
BEGIN
  SELECT primary_agency_id, boosted_by_agency_id, title
    INTO v_current_primary, v_boosted_by, v_property_title
  FROM public.properties
  WHERE id = p_property_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_boosted_by IS NULL THEN
    RETURN jsonb_build_object('status', 'no_active_boost');
  END IF;

  -- Most recent non-boost primary becomes the restore target
  SELECT to_agency_id, to_agent_id
    INTO v_prior_primary, v_prior_agent
  FROM public.primary_agency_history
  WHERE property_id = p_property_id
    AND reason <> 'boost_start'
  ORDER BY transitioned_at DESC
  LIMIT 1;

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

  -- Notify the agency whose boost just ended
  PERFORM public.create_agency_notification(
    v_boosted_by,
    'boost_ended',
    'Your boost has ended',
    'Boost on "' || COALESCE(v_property_title, 'Untitled') || '" expired. Primary status restored to the original agency.',
    '/agency/listings/' || p_property_id::text
  );

  RETURN jsonb_build_object(
    'status', 'boost_ended',
    'restored_primary_agency_id', v_prior_primary
  );
END;
$$;