CREATE OR REPLACE FUNCTION public.ensure_pending_review_submitted_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.verification_status = 'pending_review' AND NEW.submitted_at IS NULL THEN
    NEW.submitted_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_pending_review_submitted_at_trigger ON public.properties;

CREATE TRIGGER ensure_pending_review_submitted_at_trigger
BEFORE INSERT OR UPDATE OF verification_status, submitted_at ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.ensure_pending_review_submitted_at();