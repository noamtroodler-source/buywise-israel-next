CREATE TABLE IF NOT EXISTS public.listing_agency_reviews (
  property_id UUID PRIMARY KEY REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'needs_review',
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  review_notes TEXT,
  skipped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT listing_agency_reviews_status_check CHECK (status IN ('needs_review', 'approved_live', 'needs_edit', 'archived_stale'))
);

ALTER TABLE public.listing_agency_reviews ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_listing_agency_reviews_agency_status
  ON public.listing_agency_reviews (agency_id, status);

CREATE OR REPLACE FUNCTION public.can_manage_listing_agency_review(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.agencies a ON a.id = p.primary_agency_id
    WHERE p.id = p_property_id
      AND a.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.agents ag ON ag.agency_id = p.primary_agency_id
    WHERE p.id = p_property_id
      AND ag.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::public.app_role);
$$;

CREATE POLICY "Admins manage listing agency reviews"
ON public.listing_agency_reviews
FOR ALL
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Owning agencies view listing agency reviews"
ON public.listing_agency_reviews
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = listing_agency_reviews.agency_id
      AND a.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.agents ag
    WHERE ag.agency_id = listing_agency_reviews.agency_id
      AND ag.user_id = auth.uid()
  )
);

CREATE POLICY "Owning agencies update listing agency reviews"
ON public.listing_agency_reviews
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = listing_agency_reviews.agency_id
      AND a.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.agents ag
    WHERE ag.agency_id = listing_agency_reviews.agency_id
      AND ag.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = listing_agency_reviews.agency_id
      AND a.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.agents ag
    WHERE ag.agency_id = listing_agency_reviews.agency_id
      AND ag.user_id = auth.uid()
  )
);

CREATE POLICY "Agency admins view owned unpublished properties"
ON public.properties
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = properties.primary_agency_id
      AND a.admin_user_id = auth.uid()
  )
);

CREATE POLICY "Agency admins update owned properties"
ON public.properties
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = properties.primary_agency_id
      AND a.admin_user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = properties.primary_agency_id
      AND a.admin_user_id = auth.uid()
  )
);

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
        updated_at = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_listing_agency_review_on_properties ON public.properties;
CREATE TRIGGER ensure_listing_agency_review_on_properties
AFTER INSERT OR UPDATE OF primary_agency_id, is_published, verification_status
ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.ensure_listing_agency_review();

INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at)
SELECT p.id,
       p.primary_agency_id,
       CASE WHEN p.is_published = true AND p.verification_status = 'approved' THEN 'approved_live' ELSE 'needs_review' END,
       CASE WHEN p.is_published = true AND p.verification_status = 'approved' THEN now() ELSE NULL END
FROM public.properties p
WHERE p.primary_agency_id IS NOT NULL
ON CONFLICT (property_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.approve_agency_listing(p_property_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  IF NOT public.can_manage_listing_agency_review(p_property_id) THEN
    RAISE EXCEPTION 'Not authorized to approve this listing';
  END IF;

  SELECT primary_agency_id INTO v_agency_id
  FROM public.properties
  WHERE id = p_property_id;

  IF v_agency_id IS NULL THEN
    RETURN FALSE;
  END IF;

  INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at, reviewed_by, review_notes, skipped_at)
  VALUES (p_property_id, v_agency_id, 'approved_live', now(), auth.uid(), p_notes, NULL)
  ON CONFLICT (property_id) DO UPDATE
  SET status = 'approved_live',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      review_notes = p_notes,
      skipped_at = NULL,
      updated_at = now();

  UPDATE public.properties
  SET verification_status = 'approved',
      is_published = true,
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      updated_at = now()
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_agency_listing_needs_edit(p_property_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  IF NOT public.can_manage_listing_agency_review(p_property_id) THEN
    RAISE EXCEPTION 'Not authorized to update this listing';
  END IF;

  SELECT primary_agency_id INTO v_agency_id FROM public.properties WHERE id = p_property_id;
  IF v_agency_id IS NULL THEN RETURN FALSE; END IF;

  INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at, reviewed_by, review_notes)
  VALUES (p_property_id, v_agency_id, 'needs_edit', now(), auth.uid(), p_notes)
  ON CONFLICT (property_id) DO UPDATE
  SET status = 'needs_edit', reviewed_at = now(), reviewed_by = auth.uid(), review_notes = p_notes, updated_at = now();

  UPDATE public.properties
  SET verification_status = 'changes_requested', is_published = false, updated_at = now()
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.archive_agency_listing(p_property_id UUID, p_notes TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  IF NOT public.can_manage_listing_agency_review(p_property_id) THEN
    RAISE EXCEPTION 'Not authorized to archive this listing';
  END IF;

  SELECT primary_agency_id INTO v_agency_id FROM public.properties WHERE id = p_property_id;
  IF v_agency_id IS NULL THEN RETURN FALSE; END IF;

  INSERT INTO public.listing_agency_reviews (property_id, agency_id, status, reviewed_at, reviewed_by, review_notes)
  VALUES (p_property_id, v_agency_id, 'archived_stale', now(), auth.uid(), p_notes)
  ON CONFLICT (property_id) DO UPDATE
  SET status = 'archived_stale', reviewed_at = now(), reviewed_by = auth.uid(), review_notes = p_notes, updated_at = now();

  UPDATE public.properties
  SET is_published = false, updated_at = now()
  WHERE id = p_property_id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.skip_agency_listing_review(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.can_manage_listing_agency_review(p_property_id) THEN
    RAISE EXCEPTION 'Not authorized to skip this listing';
  END IF;

  UPDATE public.listing_agency_reviews
  SET skipped_at = now(), updated_at = now()
  WHERE property_id = p_property_id;

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.bulk_approve_agency_listings(p_property_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_property_id UUID;
  v_approved INTEGER := 0;
  v_skipped INTEGER := 0;
BEGIN
  FOREACH v_property_id IN ARRAY p_property_ids LOOP
    IF public.can_manage_listing_agency_review(v_property_id) THEN
      PERFORM public.approve_agency_listing(v_property_id, 'Batch approved by agency');
      v_approved := v_approved + 1;
    ELSE
      v_skipped := v_skipped + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object('approved', v_approved, 'skipped', v_skipped);
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_publish_on_quality_score()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.import_source IS NOT NULL AND NEW.data_quality_score IS NOT NULL THEN
    IF NEW.data_quality_score >= 60
       AND OLD.is_published = false
       AND EXISTS (
         SELECT 1 FROM public.listing_agency_reviews lar
         WHERE lar.property_id = NEW.id
           AND lar.status = 'approved_live'
       ) THEN
      NEW.is_published := true;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;