CREATE OR REPLACE FUNCTION public.transfer_agency_ownership(
  _agency_id uuid,
  _new_owner uuid,
  _actor uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure new owner is at least an admin
  INSERT INTO public.agency_members (agency_id, user_id, role, created_by)
  VALUES (_agency_id, _new_owner, 'admin', _actor)
  ON CONFLICT (agency_id, user_id, role) DO NOTHING;

  -- Atomic swap: delete then insert in same transaction (function = txn)
  DELETE FROM public.agency_members
  WHERE agency_id = _agency_id AND role = 'owner';

  INSERT INTO public.agency_members (agency_id, user_id, role, created_by)
  VALUES (_agency_id, _new_owner, 'owner', _actor)
  ON CONFLICT (agency_id, user_id, role) DO NOTHING;

  -- Sync legacy pointer
  UPDATE public.agencies SET admin_user_id = _new_owner WHERE id = _agency_id;
END;
$$;