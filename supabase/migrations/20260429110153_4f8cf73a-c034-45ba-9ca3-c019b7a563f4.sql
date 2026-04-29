CREATE OR REPLACE FUNCTION public.approve_agency_join_request(
  p_request_id uuid,
  p_agent_id uuid,
  p_agency_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_user_id uuid;
  v_request_exists boolean;
  v_agent_status text;
BEGIN
  SELECT admin_user_id INTO v_admin_user_id
  FROM public.agencies
  WHERE id = p_agency_id;

  IF v_admin_user_id IS NULL OR v_admin_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only this agency admin can approve this request';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.agency_join_requests
    WHERE id = p_request_id
      AND agent_id = p_agent_id
      AND agency_id = p_agency_id
      AND status = 'pending'
  ) INTO v_request_exists;

  IF NOT v_request_exists THEN
    RAISE EXCEPTION 'Pending join request not found';
  END IF;

  SELECT status INTO v_agent_status
  FROM public.agents
  WHERE id = p_agent_id;

  IF v_agent_status = 'suspended' THEN
    RAISE EXCEPTION 'Suspended agents require BuyWise review';
  END IF;

  UPDATE public.agency_join_requests
  SET status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid()
  WHERE id = p_request_id;

  UPDATE public.agents
  SET agency_id = p_agency_id,
      status = 'active',
      is_verified = true,
      approved_at = now(),
      approved_by = auth.uid(),
      updated_at = now()
  WHERE id = p_agent_id;
END;
$$;