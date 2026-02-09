-- Add expires_at column with 30-day default
ALTER TABLE public.content_visits
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone 
  DEFAULT (now() + interval '30 days');

-- Backfill existing records
UPDATE public.content_visits
SET expires_at = last_visited_at + interval '30 days'
WHERE expires_at IS NULL;

-- Create trigger function to auto-update expires_at
CREATE OR REPLACE FUNCTION public.update_content_visit_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.last_visited_at + interval '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
DROP TRIGGER IF EXISTS content_visit_expiry_trigger ON public.content_visits;
CREATE TRIGGER content_visit_expiry_trigger
  BEFORE INSERT OR UPDATE OF last_visited_at ON public.content_visits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_content_visit_expiry();