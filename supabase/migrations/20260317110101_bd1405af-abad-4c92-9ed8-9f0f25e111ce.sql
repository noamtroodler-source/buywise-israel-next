
-- Add buyer context snapshot to property inquiries
ALTER TABLE public.property_inquiries 
ADD COLUMN IF NOT EXISTS buyer_context_snapshot JSONB DEFAULT NULL;

-- Add buyer context snapshot to project inquiries
ALTER TABLE public.project_inquiries 
ADD COLUMN IF NOT EXISTS buyer_context_snapshot JSONB DEFAULT NULL;

-- Add session_id for guest rate limiting
ALTER TABLE public.property_inquiries 
ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL;

ALTER TABLE public.project_inquiries 
ADD COLUMN IF NOT EXISTS session_id TEXT DEFAULT NULL;

-- Create dedupe function for property inquiries
CREATE OR REPLACE FUNCTION public.check_inquiry_dedupe(
  p_user_id UUID,
  p_property_id UUID,
  p_inquiry_type TEXT,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_inquiries
    WHERE property_id = p_property_id
      AND inquiry_type = p_inquiry_type
      AND created_at > now() - interval '24 hours'
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND p_session_id IS NOT NULL AND session_id = p_session_id)
      )
  );
$$;

-- Create dedupe function for project inquiries
CREATE OR REPLACE FUNCTION public.check_project_inquiry_dedupe(
  p_user_id UUID,
  p_project_id UUID,
  p_inquiry_type TEXT,
  p_session_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.project_inquiries
    WHERE project_id = p_project_id
      AND created_at > now() - interval '24 hours'
      AND (
        (p_user_id IS NOT NULL AND user_id = p_user_id)
        OR (p_user_id IS NULL AND p_session_id IS NOT NULL AND session_id = p_session_id)
      )
  );
$$;
