CREATE OR REPLACE FUNCTION public.is_founding_agency(p_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_agencies AS (
    SELECT id, row_number() OVER (ORDER BY created_at ASC, id ASC) AS agency_rank
    FROM public.agencies
  )
  SELECT EXISTS (
    SELECT 1
    FROM public.founding_partners fp
    WHERE fp.agency_id = p_agency_id
      AND fp.is_active = true
  )
  OR EXISTS (
    SELECT 1
    FROM ranked_agencies ra
    WHERE ra.id = p_agency_id
      AND ra.agency_rank <= 30
  );
$$;

CREATE OR REPLACE FUNCTION public.get_founding_featured_status(p_agency_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_founding boolean;
  v_free_total integer := 3;
  v_free_used integer := 0;
BEGIN
  v_is_founding := public.is_founding_agency(p_agency_id);

  IF v_is_founding THEN
    SELECT count(*)::integer
    INTO v_free_used
    FROM public.featured_listings fl
    WHERE fl.agency_id = p_agency_id
      AND fl.is_active = true
      AND fl.is_free_credit = true;
  END IF;

  RETURN jsonb_build_object(
    'isFoundingPartner', v_is_founding,
    'freeCreditsTotal', CASE WHEN v_is_founding THEN v_free_total ELSE 0 END,
    'freeCreditsRemaining', CASE WHEN v_is_founding THEN greatest(0, v_free_total - v_free_used) ELSE 0 END,
    'freeCreditsUsed', CASE WHEN v_is_founding THEN v_free_used ELSE 0 END
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_featured_listing_credit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_free_used integer := 0;
BEGIN
  IF NEW.is_active IS DISTINCT FROM true THEN
    RETURN NEW;
  END IF;

  IF public.is_founding_agency(NEW.agency_id) THEN
    SELECT count(*)::integer
    INTO v_free_used
    FROM public.featured_listings fl
    WHERE fl.agency_id = NEW.agency_id
      AND fl.is_active = true
      AND fl.is_free_credit = true;

    NEW.is_free_credit := v_free_used < 3;
  ELSE
    NEW.is_free_credit := false;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_featured_listing_credit_before_insert ON public.featured_listings;
CREATE TRIGGER normalize_featured_listing_credit_before_insert
BEFORE INSERT ON public.featured_listings
FOR EACH ROW
EXECUTE FUNCTION public.normalize_featured_listing_credit();

UPDATE public.agencies a
SET is_partner = true
WHERE public.is_founding_agency(a.id);