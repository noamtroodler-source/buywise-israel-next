ALTER TABLE public.listing_agency_reviews
DROP CONSTRAINT IF EXISTS listing_agency_reviews_status_check;

ALTER TABLE public.listing_agency_reviews
ADD CONSTRAINT listing_agency_reviews_status_check
CHECK (status IN ('needs_review', 'agency_confirmed', 'approved_live', 'needs_edit', 'archived_stale'));

CREATE OR REPLACE FUNCTION public.ensure_listing_agency_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.primary_agency_id IS NOT NULL THEN
    INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at)
    VALUES (
      NEW.id,
      NEW.primary_agency_id,
      CASE WHEN NEW.is_published = true AND NEW.verification_status = 'approved' THEN 'approved_live' ELSE 'needs_review' END,
      CASE WHEN NEW.is_published = true AND NEW.verification_status = 'approved' THEN now() ELSE NULL END
    )
    ON CONFLICT (property_id) DO UPDATE
    SET agency_id = EXCLUDED.agency_id,
        status = CASE
          WHEN NEW.is_published = true AND NEW.verification_status = 'approved' THEN 'approved_live'
          ELSE public.listing_agency_reviews.status
        END,
        reviewed_at = CASE
          WHEN NEW.is_published = true AND NEW.verification_status = 'approved' THEN COALESCE(public.listing_agency_reviews.reviewed_at, now())
          ELSE public.listing_agency_reviews.reviewed_at
        END,
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.confirm_agency_listing(p_property_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  IF NOT public.can_manage_listing_agency_review(p_property_id) THEN
    RAISE EXCEPTION 'Not authorized to confirm this listing';
  END IF;

  SELECT primary_agency_id INTO v_agency_id
  FROM public.properties
  WHERE id = p_property_id;

  IF v_agency_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at, reviewed_by, review_notes, skipped_at)
  VALUES (p_property_id, v_agency_id, 'agency_confirmed', now(), auth.uid(), p_notes, NULL)
  ON CONFLICT (property_id) DO UPDATE
  SET status = 'agency_confirmed',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = p_notes,
      skipped_at = NULL,
      updated_at = now();

  UPDATE public.properties
  SET verification_status = 'pending_review',
      submitted_at = now(),
      is_published = false,
      reviewed_at = NULL,
      reviewed_by = NULL,
      updated_at = now()
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.approve_agency_listing(p_property_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.confirm_agency_listing(p_property_id, p_notes);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_confirm_agency_listings(p_property_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id UUID;
  v_confirmed INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOREACH v_property_id IN ARRAY p_property_ids LOOP
    IF public.can_manage_listing_agency_review(v_property_id) THEN
      PERFORM public.confirm_agency_listing(v_property_id, 'Batch confirmed by agency');
      v_confirmed := v_confirmed + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('confirmed', v_confirmed, 'skipped', v_skipped);
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_approve_agency_listings(p_property_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.bulk_confirm_agency_listings(p_property_ids);
END;
$$;