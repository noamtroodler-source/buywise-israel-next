-- Fix 1: Replace permissive agency_invites SELECT policy with a more secure approach
-- Create a SECURITY DEFINER function for invite validation instead of direct table access

-- First, drop the existing permissive policy
DROP POLICY IF EXISTS "Anyone can read active invite codes for validation" ON public.agency_invites;

-- Create the secure validation function (already exists as use_agency_invite_code, but let's create a read-only version)
CREATE OR REPLACE FUNCTION public.validate_agency_invite_code(invite_code TEXT)
RETURNS TABLE(agency_id UUID, agency_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ai.agency_id, a.name as agency_name
  FROM public.agency_invites ai
  JOIN public.agencies a ON a.id = ai.agency_id
  WHERE ai.code = invite_code
    AND ai.is_active = true
    AND (ai.expires_at IS NULL OR ai.expires_at > now())
    AND (ai.uses_remaining IS NULL OR ai.uses_remaining > 0)
  LIMIT 1;
$$;

-- Also check agencies.default_invite_code as fallback
CREATE OR REPLACE FUNCTION public.validate_default_invite_code(invite_code TEXT)
RETURNS TABLE(agency_id UUID, agency_name TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.id as agency_id, a.name as agency_name
  FROM public.agencies a
  WHERE a.default_invite_code = invite_code
  LIMIT 1;
$$;

-- Fix 2: Restrict project_inquiries INSERT to require essential fields validation
-- Drop the permissive policy
DROP POLICY IF EXISTS "Anyone can submit project inquiries" ON public.project_inquiries;

-- Create a more restrictive policy that still allows public submissions but validates essential fields
-- Since this is a public inquiry form, we keep it open but ensure required fields are present
CREATE POLICY "Anyone can submit project inquiries with required fields"
ON public.project_inquiries
FOR INSERT
WITH CHECK (
  -- Require essential fields to be non-null
  name IS NOT NULL AND name <> '' AND
  email IS NOT NULL AND email <> '' AND
  message IS NOT NULL AND message <> '' AND
  project_id IS NOT NULL AND
  developer_id IS NOT NULL
);

-- Fix 3: Restrict project_views INSERT to require essential fields
-- Drop the permissive policy
DROP POLICY IF EXISTS "Anyone can insert project views" ON public.project_views;

-- Create a more restrictive policy that validates project_id exists
CREATE POLICY "Anyone can insert project views with valid project"
ON public.project_views
FOR INSERT
WITH CHECK (
  -- Require project_id and ensure session_id is provided for tracking
  project_id IS NOT NULL AND
  (session_id IS NOT NULL OR viewer_id IS NOT NULL)
);