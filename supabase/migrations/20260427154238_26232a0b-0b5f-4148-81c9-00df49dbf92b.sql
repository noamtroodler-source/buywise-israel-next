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

  SELECT count(*)::integer
  INTO v_free_used
  FROM public.featured_listings fl
  WHERE fl.agency_id = p_agency_id
    AND fl.is_active = true
    AND fl.is_free_credit = true;

  RETURN jsonb_build_object(
    'isFoundingPartner', v_is_founding,
    'freeCreditsTotal', v_free_total,
    'freeCreditsRemaining', greatest(0, v_free_total - v_free_used),
    'freeCreditsUsed', v_free_used
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

  SELECT count(*)::integer
  INTO v_free_used
  FROM public.featured_listings fl
  WHERE fl.agency_id = NEW.agency_id
    AND fl.is_active = true
    AND fl.is_free_credit = true;

  NEW.is_free_credit := v_free_used < 3;

  RETURN NEW;
END;
$$;