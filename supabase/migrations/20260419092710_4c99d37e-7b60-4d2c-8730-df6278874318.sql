DO $$
DECLARE v_uid uuid;
BEGIN
  SELECT id INTO v_uid FROM auth.users WHERE email = 'noamt913@gmail.com';
  IF v_uid IS NOT NULL THEN
    DELETE FROM public.user_roles WHERE user_id = v_uid;
    DELETE FROM public.profiles WHERE id = v_uid;
    DELETE FROM auth.identities WHERE user_id = v_uid;
    DELETE FROM auth.users WHERE id = v_uid;
  END IF;
END $$;