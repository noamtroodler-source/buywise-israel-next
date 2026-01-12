-- Tighten profiles access for agents: only allow viewing profiles tied to their own inquiries

-- 1) Helper: can the current agent (by user_id) view a given profile (by profile id)?
CREATE OR REPLACE FUNCTION public.can_agent_view_profile(_agent_user_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.agents a
    JOIN public.inquiries i ON i.agent_id = a.id
    WHERE a.user_id = _agent_user_id
      AND i.user_id = _profile_id
  );
$$;

-- 2) Replace overly-broad agent SELECT policy
DROP POLICY IF EXISTS "Agents can view profiles for their inquiries" ON public.profiles;

CREATE POLICY "Agents can view profiles for their own inquiries"
ON public.profiles
FOR SELECT
USING (
  public.has_role(auth.uid(), 'agent')
  AND public.can_agent_view_profile(auth.uid(), id)
);
