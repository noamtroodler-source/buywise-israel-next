CREATE OR REPLACE FUNCTION public.enforce_imported_listing_publish_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.import_source IS NOT NULL
     AND NEW.import_source <> 'manual'
     AND NEW.verification_status IS DISTINCT FROM 'approved' THEN
    NEW.is_published := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_imported_listing_publish_guard ON public.properties;

CREATE TRIGGER enforce_imported_listing_publish_guard
BEFORE INSERT OR UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.enforce_imported_listing_publish_guard();

UPDATE public.properties
SET is_published = false,
    updated_at = now()
WHERE import_source IS NOT NULL
  AND import_source <> 'manual'
  AND verification_status IS DISTINCT FROM 'approved'
  AND is_published = true;