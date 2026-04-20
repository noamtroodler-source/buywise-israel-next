-- Read-only validator: peeks at a setup token without marking it used.
CREATE OR REPLACE FUNCTION public.validate_password_setup_token(p_token UUID)
RETURNS TABLE (
  user_id UUID,
  agency_id UUID,
  purpose public.password_setup_purpose,
  is_valid BOOLEAN,
  was_already_used BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_row record;
BEGIN
  SELECT t.user_id, t.agency_id, t.purpose, t.used_at
    INTO v_row
  FROM public.password_setup_tokens t
  WHERE t.token = p_token;

  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::UUID, NULL::UUID, NULL::public.password_setup_purpose, false, false;
    RETURN;
  END IF;

  IF v_row.used_at IS NOT NULL THEN
    RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, false, true;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_row.user_id, v_row.agency_id, v_row.purpose, true, false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_password_setup_token(UUID) TO anon, authenticated;