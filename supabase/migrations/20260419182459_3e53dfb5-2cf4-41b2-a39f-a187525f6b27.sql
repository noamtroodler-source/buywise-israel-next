
-- 1. Track which listings were manually added vs scraped
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS added_manually boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.properties.added_manually IS
  'True when an agency typed/uploaded this listing through the wizard. False for scraped/imported listings. Manual ownership trumps scraped attribution.';

UPDATE public.properties
SET added_manually = true
WHERE import_source IS NULL AND added_manually = false;

-- 2. Co-listing request queue
CREATE TABLE IF NOT EXISTS public.co_listing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requesting_agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  existing_property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  existing_agency_id uuid REFERENCES public.agencies(id) ON DELETE SET NULL,
  attempted_address text NOT NULL,
  attempted_city text,
  attempted_neighborhood text,
  similarity_score integer NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','withdrawn')),
  reviewed_by uuid,
  reviewed_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_co_listing_requests_status
  ON public.co_listing_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_co_listing_requests_requesting_agency
  ON public.co_listing_requests(requesting_agency_id);
CREATE INDEX IF NOT EXISTS idx_co_listing_requests_existing_property
  ON public.co_listing_requests(existing_property_id);

ALTER TABLE public.co_listing_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage all co-listing requests" ON public.co_listing_requests;
CREATE POLICY "Admins manage all co-listing requests"
  ON public.co_listing_requests FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Agencies see requests they're involved in" ON public.co_listing_requests;
CREATE POLICY "Agencies see requests they're involved in"
  ON public.co_listing_requests FOR SELECT
  USING (
    requesting_agency_id IN (SELECT agency_id FROM public.agents WHERE user_id = auth.uid())
    OR existing_agency_id IN (SELECT agency_id FROM public.agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Agencies create their own requests" ON public.co_listing_requests;
CREATE POLICY "Agencies create their own requests"
  ON public.co_listing_requests FOR INSERT
  WITH CHECK (
    requesting_agency_id IN (SELECT agency_id FROM public.agents WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Agencies withdraw their own requests" ON public.co_listing_requests;
CREATE POLICY "Agencies withdraw their own requests"
  ON public.co_listing_requests FOR UPDATE
  USING (
    requesting_agency_id IN (SELECT agency_id FROM public.agents WHERE user_id = auth.uid())
  );

DROP TRIGGER IF EXISTS update_co_listing_requests_updated_at ON public.co_listing_requests;
CREATE TRIGGER update_co_listing_requests_updated_at
  BEFORE UPDATE ON public.co_listing_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Drop + recreate detection v2 with extra return columns
DROP FUNCTION IF EXISTS public.check_cross_agency_duplicate_v2(uuid,text,text,text,numeric,integer,numeric,numeric,numeric,integer,text);

CREATE FUNCTION public.check_cross_agency_duplicate_v2(
  p_attempted_agency_id uuid,
  p_address text,
  p_city text,
  p_neighborhood text,
  p_size_sqm numeric,
  p_bedrooms integer,
  p_price numeric,
  p_latitude numeric,
  p_longitude numeric,
  p_floor_number integer DEFAULT NULL,
  p_apartment_number text DEFAULT NULL
)
RETURNS TABLE(
  property_id uuid,
  existing_agency_id uuid,
  existing_source_url text,
  existing_added_manually boolean,
  existing_import_source text,
  similarity_score integer,
  same_building_different_unit boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_norm_address text;
BEGIN
  IF p_address IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;

  v_norm_address := lower(regexp_replace(p_address, '[,.\-/\\''"]', ' ', 'g'));
  v_norm_address := lower(regexp_replace(v_norm_address, '\s+', ' ', 'g'));
  v_norm_address := trim(v_norm_address);

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.agency_id,
      p.source_url,
      p.added_manually,
      p.import_source,
      p.floor_number,
      p.apartment_number,
      (
        CASE
          WHEN lower(regexp_replace(COALESCE(p.address, ''), '[,.\-/\\''"]', ' ', 'g')) = v_norm_address THEN 40
          WHEN p.address IS NOT NULL AND (
            position(v_norm_address IN lower(p.address)) > 0
            OR position(lower(p.address) IN v_norm_address) > 0
          ) THEN 25
          ELSE 0
        END
        + CASE
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0002
            AND abs(p.longitude - p_longitude) < 0.0002 THEN 30
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0005
            AND abs(p.longitude - p_longitude) < 0.0005 THEN 15
          ELSE 0
        END
        + CASE
          WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
            AND abs(p.size_sqm - p_size_sqm) <= 5 THEN 15
          WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
            AND abs(p.size_sqm - p_size_sqm) <= 10 THEN 8
          ELSE 0
        END
        + CASE
          WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL
            AND p.bedrooms = p_bedrooms THEN 10
          ELSE 0
        END
        + CASE
          WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0
            AND abs(p.price - p_price) / GREATEST(p.price, p_price) <= 0.05 THEN 5
          ELSE 0
        END
      )::integer AS raw_score
    FROM public.properties p
    WHERE p.is_published = true
      AND p.agency_id IS NOT NULL
      AND p.agency_id != p_attempted_agency_id
      AND lower(p.city) = lower(p_city)
      AND (p_neighborhood IS NULL OR p.neighborhood IS NULL OR lower(p.neighborhood) = lower(p_neighborhood))
      AND (
        p_latitude IS NULL OR p.latitude IS NULL
        OR (abs(p.latitude - p_latitude) < 0.005 AND abs(p.longitude - p_longitude) < 0.005)
      )
  )
  SELECT
    b.id,
    b.agency_id,
    b.source_url,
    b.added_manually,
    b.import_source,
    CASE
      WHEN (p_floor_number IS NOT NULL AND b.floor_number IS NOT NULL AND p_floor_number != b.floor_number)
        OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
            AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
      THEN LEAST(b.raw_score, 50)
      ELSE b.raw_score
    END AS similarity_score,
    (
      (p_floor_number IS NOT NULL AND b.floor_number IS NOT NULL AND p_floor_number != b.floor_number)
      OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
          AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
    ) AS same_building_different_unit
  FROM base b
  ORDER BY raw_score DESC
  LIMIT 1;
END;
$function$;

-- 4. Updated auto-resolve: scraped existing → silent co-listing
CREATE OR REPLACE FUNCTION public.auto_resolve_obvious_conflict(p_conflict_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conflict record;
  v_existing_norm text;
  v_attempted_norm text;
  v_existing_manual boolean;
BEGIN
  SELECT c.*, p.added_manually AS existing_added_manually
    INTO v_conflict
  FROM public.cross_agency_conflicts c
  JOIN public.properties p ON p.id = c.existing_property_id
  WHERE c.id = p_conflict_id AND c.status = 'pending';

  IF v_conflict IS NULL THEN
    RETURN jsonb_build_object('auto_resolved', false, 'reason', 'not_pending_or_missing');
  END IF;

  v_existing_norm := public.normalize_url(v_conflict.existing_source_url);
  v_attempted_norm := public.normalize_url(v_conflict.attempted_source_url);
  v_existing_manual := COALESCE(v_conflict.existing_added_manually, false);

  IF NOT v_existing_manual THEN
    UPDATE public.cross_agency_conflicts
    SET status = 'co_listing_confirmed',
        auto_resolved = true,
        auto_resolution_reason = 'scraped_listing_silent_colist',
        resolution_notes = 'Auto-resolved: existing listing was scraped, not manually claimed. Treated as co-listing.',
        resolved_at = now()
    WHERE id = p_conflict_id;
    RETURN jsonb_build_object('auto_resolved', true, 'reason', 'scraped_listing_silent_colist');
  END IF;

  IF v_existing_norm IS NOT NULL
     AND v_existing_norm = v_attempted_norm
     AND (v_existing_norm LIKE '%yad2.co.il%' OR v_existing_norm LIKE '%madlan.co.il%')
  THEN
    UPDATE public.cross_agency_conflicts
    SET status = 'co_listing_confirmed',
        auto_resolved = true,
        auto_resolution_reason = 'identical_aggregator_url',
        resolution_notes = 'Auto-resolved: both agencies reference the same Yad2/Madlan listing.',
        resolved_at = now()
    WHERE id = p_conflict_id;
    RETURN jsonb_build_object('auto_resolved', true, 'reason', 'identical_aggregator_url');
  END IF;

  RETURN jsonb_build_object('auto_resolved', false, 'reason', 'no_rule_matched');
END;
$function$;
