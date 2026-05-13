-- Step 1: Owner vs Admin model — create agency_members table, helpers, backfill, and RLS updates

-- 1. Create agency_members table (owner/admin roles only; agents stay in agents table)
CREATE TABLE IF NOT EXISTS public.agency_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin')),
  is_primary_contact boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  UNIQUE (agency_id, user_id, role)
);

-- One owner per agency
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_members_one_owner
  ON public.agency_members (agency_id) WHERE role = 'owner';

-- One primary contact per agency
CREATE UNIQUE INDEX IF NOT EXISTS idx_agency_members_one_primary
  ON public.agency_members (agency_id) WHERE is_primary_contact = true;

CREATE INDEX IF NOT EXISTS idx_agency_members_user ON public.agency_members(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_members_agency ON public.agency_members(agency_id);

ALTER TABLE public.agency_members ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer helper functions (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.is_agency_owner(_user_id uuid, _agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id AND role = 'owner'
  ) OR EXISTS (
    -- legacy fallback so existing data keeps working until backfill completes
    SELECT 1 FROM public.agencies
    WHERE id = _agency_id AND admin_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agency_admin(_user_id uuid, _agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_members
    WHERE user_id = _user_id AND agency_id = _agency_id AND role IN ('owner','admin')
  ) OR EXISTS (
    SELECT 1 FROM public.agencies
    WHERE id = _agency_id AND admin_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_agency_member(_user_id uuid, _agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_agency_admin(_user_id, _agency_id) OR EXISTS (
    SELECT 1 FROM public.agents
    WHERE user_id = _user_id AND agency_id = _agency_id
  );
$$;

CREATE OR REPLACE FUNCTION public.get_my_agency_role(_agency_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN public.is_agency_owner(auth.uid(), _agency_id) THEN 'owner'
    WHEN public.is_agency_admin(auth.uid(), _agency_id) THEN 'admin'
    WHEN EXISTS (SELECT 1 FROM public.agents WHERE user_id = auth.uid() AND agency_id = _agency_id) THEN 'agent'
    ELSE NULL
  END;
$$;

-- 3. RLS policies on agency_members
CREATE POLICY "Members can view their agency members"
  ON public.agency_members FOR SELECT
  USING (public.is_agency_member(auth.uid(), agency_id));

CREATE POLICY "Admins can insert agency members"
  ON public.agency_members FOR INSERT
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Admins can update agency members"
  ON public.agency_members FOR UPDATE
  USING (public.is_agency_admin(auth.uid(), agency_id));

CREATE POLICY "Owners can delete agency members"
  ON public.agency_members FOR DELETE
  USING (public.is_agency_owner(auth.uid(), agency_id));

-- 4. Backfill: every existing admin_user_id becomes owner + admin + primary_contact
INSERT INTO public.agency_members (agency_id, user_id, role, is_primary_contact, created_by)
SELECT id, admin_user_id, 'owner', true, admin_user_id
FROM public.agencies
WHERE admin_user_id IS NOT NULL
ON CONFLICT (agency_id, user_id, role) DO NOTHING;

INSERT INTO public.agency_members (agency_id, user_id, role, is_primary_contact, created_by)
SELECT id, admin_user_id, 'admin', false, admin_user_id
FROM public.agencies
WHERE admin_user_id IS NOT NULL
ON CONFLICT (agency_id, user_id, role) DO NOTHING;

-- 5. Guard trigger: prevent demoting the last admin / orphaning the agency
CREATE OR REPLACE FUNCTION public.prevent_last_admin_removal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  remaining_admins int;
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role IN ('owner','admin'))
     OR (TG_OP = 'UPDATE' AND OLD.role IN ('owner','admin') AND NEW.role NOT IN ('owner','admin')) THEN
    SELECT COUNT(*) INTO remaining_admins
    FROM public.agency_members
    WHERE agency_id = OLD.agency_id
      AND role IN ('owner','admin')
      AND id <> OLD.id;
    IF remaining_admins = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last admin/owner from agency %', OLD.agency_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_last_admin_removal ON public.agency_members;
CREATE TRIGGER trg_prevent_last_admin_removal
  BEFORE DELETE OR UPDATE ON public.agency_members
  FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_removal();