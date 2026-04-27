CREATE OR REPLACE FUNCTION public.consume_password_setup_token(p_token uuid)
RETURNS TABLE(user_id uuid, agency_id uuid, purpose public.password_setup_purpose, was_already_used boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT t.user_id, t.agency_id, t.purpose, t.used_at
    INTO v_row
  FROM public.password_setup_tokens AS t
  WHERE t.token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::uuid, NULL::public.password_setup_purpose, false;
    RETURN;
  END IF;

  IF v_row.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, true;
    RETURN;
  END IF;

  UPDATE public.password_setup_tokens AS pst
  SET used_at = now()
  WHERE pst.token = p_token;

  UPDATE public.provisional_credentials AS pc
  SET delivered_at = now()
  WHERE pc.user_id = v_row.user_id
    AND pc.delivered_at IS NULL;

  RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, false;
END;
$$;