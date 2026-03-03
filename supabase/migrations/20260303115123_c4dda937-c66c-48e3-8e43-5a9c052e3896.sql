
-- Add last_active_at to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now();

-- Create retention_emails_log table
CREATE TABLE public.retention_emails_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL,
  email_sent_to TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: block all client access (service-role only)
ALTER TABLE public.retention_emails_log ENABLE ROW LEVEL SECURITY;
-- No policies = no client access

-- Index for cooldown lookups
CREATE INDEX idx_retention_emails_user_type ON public.retention_emails_log (user_id, trigger_type, created_at DESC);

-- Index on profiles.last_active_at for dormant user queries
CREATE INDEX idx_profiles_last_active ON public.profiles (last_active_at);

-- Trigger function to update last_active_at on property_views insert
CREATE OR REPLACE FUNCTION public.update_last_active_on_property_view()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.viewer_user_id IS NOT NULL THEN
    UPDATE public.profiles SET last_active_at = now() WHERE id = NEW.viewer_user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_last_active_property_view
AFTER INSERT ON public.property_views
FOR EACH ROW
EXECUTE FUNCTION public.update_last_active_on_property_view();

-- Trigger function to update last_active_at on content_visits insert/update
CREATE OR REPLACE FUNCTION public.update_last_active_on_content_visit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles SET last_active_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_last_active_content_visit
AFTER INSERT OR UPDATE ON public.content_visits
FOR EACH ROW
EXECUTE FUNCTION public.update_last_active_on_content_visit();
