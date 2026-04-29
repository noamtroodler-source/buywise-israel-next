-- Phase 4: Israeli address normalization and unit-level evidence

CREATE OR REPLACE FUNCTION public.normalize_unit_token(p_value text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF p_value IS NULL OR length(trim(p_value)) = 0 THEN
    RETURN NULL;
  END IF;

  v := lower(trim(p_value));
  v := regexp_replace(v, '["״''׳`.,;:()\[\]{}]', '', 'g');
  v := regexp_replace(v, '\s+', '', 'g');
  RETURN nullif(v, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.extract_address_unit_evidence(p_address text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
  v_floor text[];
  v_apartment text[];
  v_entrance text[];
BEGIN
  v := coalesce(p_address, '');

  v_floor := regexp_match(v, '(?:קומה|floor|fl\.?|ק\'')\s*(-?\d{1,2})', 'i');
  v_apartment := regexp_match(v, '(?:דירה|דירת|apt\.?|apartment|unit|יחידה|#)\s*([0-9]{1,4}[א-תa-zA-Z]?)', 'i');
  v_entrance := regexp_match(v, '(?:כניסה|entrance|entry)\s*([0-9א-תa-zA-Z]{1,3})', 'i');

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'floor_number', CASE WHEN v_floor IS NULL THEN NULL ELSE (v_floor[1])::integer END,
    'apartment_number', CASE WHEN v_apartment IS NULL THEN NULL ELSE public.normalize_unit_token(v_apartment[1]) END,
    'entrance', CASE WHEN v_entrance IS NULL THEN NULL ELSE public.normalize_unit_token(v_entrance[1]) END,
    'has_unit_evidence', (v_floor IS NOT NULL OR v_apartment IS NOT NULL OR v_entrance IS NOT NULL)
  ));
END;
$$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS normalized_floor_number integer,
  ADD COLUMN IF NOT EXISTS normalized_apartment_number text,
  ADD COLUMN IF NOT EXISTS normalized_entrance text,
  ADD COLUMN IF NOT EXISTS unit_identity_key text,
  ADD COLUMN IF NOT EXISTS unit_identity_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.import_job_items
  ADD COLUMN IF NOT EXISTS normalized_floor_number integer,
  ADD COLUMN IF NOT EXISTS normalized_apartment_number text,
  ADD COLUMN IF NOT EXISTS normalized_entrance text,
  ADD COLUMN IF NOT EXISTS unit_identity_key text,
  ADD COLUMN IF NOT EXISTS unit_identity_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.build_property_unit_identity_key(
  p_building_key text,
  p_floor_number integer DEFAULT NULL,
  p_apartment_number text DEFAULT NULL,
  p_entrance text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_apartment text;
  v_entrance text;
BEGIN
  IF p_building_key IS NULL THEN
    RETURN NULL;
  END IF;

  v_apartment := public.normalize_unit_token(p_apartment_number);
  v_entrance := public.normalize_unit_token(p_entrance);

  IF v_apartment IS NOT NULL THEN
    RETURN p_building_key || '|apt:' || v_apartment;
  END IF;

  IF p_floor_number IS NOT NULL AND v_entrance IS NOT NULL THEN
    RETURN p_building_key || '|floor:' || p_floor_number::text || '|entrance:' || v_entrance;
  END IF;

  IF p_floor_number IS NOT NULL THEN
    RETURN p_building_key || '|floor:' || p_floor_number::text;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_property_building_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_city text;
  v_street text;
  v_house text;
  v_address text;
  v_geo text;
  v_building_key text;
  v_unit jsonb;
  v_floor integer;
  v_apartment text;
  v_entrance text;
BEGIN
  v_city := public.normalize_israeli_text_key(NEW.city);
  v_street := public.extract_building_street_key(NEW.address);
  v_house := public.extract_building_house_number(NEW.address);
  v_address := public.normalize_building_address_key(NEW.address);
  v_geo := public.build_geocode_key(NEW.latitude, NEW.longitude, 4);
  v_building_key := public.build_property_building_key(NEW.city, NEW.address, NEW.latitude, NEW.longitude);
  v_unit := public.extract_address_unit_evidence(NEW.address);
  v_floor := coalesce(NEW.floor_number, NEW.floor, nullif(v_unit->>'floor_number', '')::integer);
  v_apartment := coalesce(NEW.apartment_number, v_unit->>'apartment_number');
  v_entrance := v_unit->>'entrance';

  NEW.normalized_city_key := v_city;
  NEW.normalized_street_key := v_street;
  NEW.normalized_house_number := v_house;
  NEW.normalized_address_key := v_address;
  NEW.geocode_key := v_geo;
  NEW.building_key := v_building_key;
  NEW.building_key_source := CASE
    WHEN v_city IS NOT NULL AND v_street IS NOT NULL AND v_house IS NOT NULL THEN 'address_house'
    WHEN v_city IS NOT NULL AND v_geo IS NOT NULL THEN 'geocode_city'
    WHEN v_city IS NOT NULL AND v_street IS NOT NULL THEN 'city_street'
    ELSE NULL
  END;
  NEW.normalized_floor_number := v_floor;
  NEW.normalized_apartment_number := public.normalize_unit_token(v_apartment);
  NEW.normalized_entrance := public.normalize_unit_token(v_entrance);
  NEW.unit_identity_key := public.build_property_unit_identity_key(v_building_key, v_floor, v_apartment, v_entrance);
  NEW.building_identity_metadata := coalesce(NEW.building_identity_metadata, '{}'::jsonb) || jsonb_build_object(
    'last_synced_at', now(),
    'has_house_number', v_house IS NOT NULL,
    'has_geocode', v_geo IS NOT NULL
  );
  NEW.unit_identity_metadata := coalesce(NEW.unit_identity_metadata, '{}'::jsonb) || jsonb_build_object(
    'last_synced_at', now(),
    'address_unit_evidence', v_unit,
    'has_floor', v_floor IS NOT NULL,
    'has_apartment_number', public.normalize_unit_token(v_apartment) IS NOT NULL,
    'has_entrance', public.normalize_unit_token(v_entrance) IS NOT NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_property_building_identity ON public.properties;
CREATE TRIGGER trg_sync_property_building_identity
BEFORE INSERT OR UPDATE OF city, address, latitude, longitude, floor, floor_number, apartment_number
ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_building_identity();

UPDATE public.properties
SET address = address
WHERE city IS NOT NULL OR address IS NOT NULL OR latitude IS NOT NULL OR longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_unit_identity_key
  ON public.properties(unit_identity_key)
  WHERE unit_identity_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_building_unit_evidence
  ON public.properties(building_key, normalized_floor_number, normalized_apartment_number)
  WHERE building_key IS NOT NULL;

DROP FUNCTION IF EXISTS public.check_cross_agency_duplicate_v2(uuid,text,text,text,numeric,integer,numeric,numeric,numeric,integer,text);

CREATE OR REPLACE FUNCTION public.check_cross_agency_duplicate_v2(
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
  same_building_different_unit boolean,
  same_building_score integer,
  same_unit_score integer,
  duplicate_decision_band text,
  duplicate_reason_codes text[]
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_building_key text;
  v_norm_address text;
  v_geocode_key text;
  v_unit jsonb;
  v_floor integer;
  v_apartment text;
  v_unit_key text;
BEGIN
  IF p_address IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;

  v_building_key := public.build_property_building_key(p_city, p_address, p_latitude, p_longitude);
  v_norm_address := public.normalize_building_address_key(p_address);
  v_geocode_key := public.build_geocode_key(p_latitude, p_longitude, 4);
  v_unit := public.extract_address_unit_evidence(p_address);
  v_floor := coalesce(p_floor_number, nullif(v_unit->>'floor_number', '')::integer);
  v_apartment := coalesce(public.normalize_unit_token(p_apartment_number), v_unit->>'apartment_number');
  v_unit_key := public.build_property_unit_identity_key(v_building_key, v_floor, v_apartment, v_unit->>'entrance');

  RETURN QUERY
  WITH candidates AS (
    SELECT
      p.*,
      coalesce(p.primary_agency_id, p.agency_id) AS existing_agency,
      (
        CASE WHEN v_building_key IS NOT NULL AND p.building_key = v_building_key THEN 65 ELSE 0 END
        + CASE WHEN v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key THEN 20 ELSE 0 END
        + CASE WHEN v_norm_address IS NOT NULL AND p.normalized_address_key = v_norm_address THEN 15 ELSE 0 END
      )::integer AS building_score,
      (
        CASE WHEN v_unit_key IS NOT NULL AND p.unit_identity_key = v_unit_key THEN 45 ELSE 0 END
        + CASE WHEN v_apartment IS NOT NULL AND p.normalized_apartment_number IS NOT NULL AND p.normalized_apartment_number = v_apartment THEN 30 ELSE 0 END
        + CASE WHEN v_floor IS NOT NULL AND p.normalized_floor_number IS NOT NULL AND p.normalized_floor_number = v_floor THEN 15 ELSE 0 END
        + CASE WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL AND abs(p.size_sqm - p_size_sqm) <= 3 THEN 12
               WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL AND abs(p.size_sqm - p_size_sqm) <= 7 THEN 7 ELSE 0 END
        + CASE WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL AND p.bedrooms = p_bedrooms THEN 8 ELSE 0 END
        + CASE WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0 AND abs(p.price - p_price) / greatest(p.price, p_price) <= 0.03 THEN 8
               WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0 AND abs(p.price - p_price) / greatest(p.price, p_price) <= 0.07 THEN 4 ELSE 0 END
      )::integer AS unit_score,
      ARRAY_REMOVE(ARRAY[
        CASE WHEN v_building_key IS NOT NULL AND p.building_key = v_building_key THEN 'same_building_key' END,
        CASE WHEN v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key THEN 'same_geocode_key' END,
        CASE WHEN v_norm_address IS NOT NULL AND p.normalized_address_key = v_norm_address THEN 'same_normalized_address' END,
        CASE WHEN v_unit_key IS NOT NULL AND p.unit_identity_key = v_unit_key THEN 'same_unit_identity_key' END,
        CASE WHEN v_apartment IS NOT NULL AND p.normalized_apartment_number IS NOT NULL AND p.normalized_apartment_number = v_apartment THEN 'same_apartment_number' END,
        CASE WHEN v_floor IS NOT NULL AND p.normalized_floor_number IS NOT NULL AND p.normalized_floor_number = v_floor THEN 'same_floor' END,
        CASE WHEN v_apartment IS NULL AND p.normalized_apartment_number IS NULL THEN 'missing_apartment_number' END,
        CASE WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL AND abs(p.size_sqm - p_size_sqm) <= 7 THEN 'similar_size' END,
        CASE WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL AND p.bedrooms = p_bedrooms THEN 'same_bedrooms' END,
        CASE WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0 AND abs(p.price - p_price) / greatest(p.price, p_price) <= 0.07 THEN 'similar_price' END,
        CASE WHEN v_floor IS NOT NULL AND p.normalized_floor_number IS NOT NULL AND p.normalized_floor_number <> v_floor THEN 'different_floor' END,
        CASE WHEN v_apartment IS NOT NULL AND p.normalized_apartment_number IS NOT NULL AND p.normalized_apartment_number <> v_apartment THEN 'different_apartment_number' END
      ], NULL)::text[] AS reasons
    FROM public.properties p
    WHERE p.is_published = true
      AND coalesce(p.primary_agency_id, p.agency_id) IS NOT NULL
      AND coalesce(p.primary_agency_id, p.agency_id) != p_attempted_agency_id
      AND lower(p.city) = lower(p_city)
      AND (p_neighborhood IS NULL OR p.neighborhood IS NULL OR lower(p.neighborhood) = lower(p_neighborhood))
      AND (
        (v_building_key IS NOT NULL AND p.building_key = v_building_key)
        OR (v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key)
        OR (v_norm_address IS NOT NULL AND p.normalized_address_key = v_norm_address)
        OR (p_latitude IS NOT NULL AND p.latitude IS NOT NULL AND abs(p.latitude - p_latitude) < 0.005 AND abs(p.longitude - p_longitude) < 0.005)
      )
  ), scored AS (
    SELECT
      c.*,
      greatest(c.building_score, 0) AS same_building_score_calc,
      least(c.unit_score, 100) AS same_unit_score_calc,
      CASE
        WHEN c.building_score >= 65 AND (
          (v_floor IS NOT NULL AND c.normalized_floor_number IS NOT NULL AND c.normalized_floor_number <> v_floor)
          OR (v_apartment IS NOT NULL AND c.normalized_apartment_number IS NOT NULL AND c.normalized_apartment_number <> v_apartment)
        ) THEN true
        ELSE false
      END AS different_unit_evidence
    FROM candidates c
  )
  SELECT
    s.id,
    s.existing_agency,
    s.source_url,
    coalesce(s.added_manually, false),
    s.import_source,
    CASE
      WHEN s.different_unit_evidence THEN least((s.same_building_score_calc + s.same_unit_score_calc), 55)
      ELSE least((s.same_building_score_calc + s.same_unit_score_calc), 100)
    END::integer AS similarity_score,
    s.different_unit_evidence AS same_building_different_unit,
    s.same_building_score_calc::integer AS same_building_score,
    s.same_unit_score_calc::integer AS same_unit_score,
    CASE
      WHEN s.different_unit_evidence THEN 'same_building_likely_different_unit'
      WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc >= 75 THEN 'high_confidence_same_unit'
      WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc BETWEEN 45 AND 74 THEN 'possible_same_unit'
      WHEN s.same_building_score_calc >= 65 THEN 'same_building_insufficient_unit_evidence'
      ELSE 'no_match'
    END AS duplicate_decision_band,
    s.reasons AS duplicate_reason_codes
  FROM scored s
  WHERE s.same_building_score_calc >= 65 OR s.same_unit_score_calc >= 45
  ORDER BY
    CASE
      WHEN s.different_unit_evidence THEN 1
      WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc >= 75 THEN 4
      WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc >= 45 THEN 3
      ELSE 2
    END DESC,
    (s.same_building_score_calc + s.same_unit_score_calc) DESC
  LIMIT 1;
END;
$$;