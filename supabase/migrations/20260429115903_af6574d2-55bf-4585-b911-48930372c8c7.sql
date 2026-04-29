-- Phase 3 retry: building identity layer and same-building aware matching

CREATE OR REPLACE FUNCTION public.normalize_israeli_text_key(p_value text)
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
  v := regexp_replace(v, '["״''׳`.,;:()\[\]{}]', ' ', 'g');
  v := regexp_replace(v, '[-_/\\]+', ' ', 'g');
  v := regexp_replace(v, '^(רחוב|רח|שדרות|שד|סמטת|סמטה|כיכר|ככר|street|st|avenue|ave|road|rd|boulevard|blvd|rechov|sderot)\s+', '', 'i');
  v := replace(v, 'ך', 'כ');
  v := replace(v, 'ם', 'מ');
  v := replace(v, 'ן', 'נ');
  v := replace(v, 'ף', 'פ');
  v := replace(v, 'ץ', 'צ');
  v := regexp_replace(v, '\s+', ' ', 'g');
  v := trim(v);

  RETURN nullif(v, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.normalize_building_address_key(p_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  IF p_address IS NULL OR length(trim(p_address)) = 0 THEN
    RETURN NULL;
  END IF;

  v := lower(trim(p_address));
  v := regexp_replace(v, '(,?\s*)(דירה|דירת|קומה|כניסה|apt\.?|apartment|floor|unit|suite|ste\.?|#)\s*[[:alnum:]א-ת-]*', ' ', 'gi');
  v := public.normalize_israeli_text_key(v);
  RETURN v;
END;
$$;

CREATE OR REPLACE FUNCTION public.extract_building_house_number(p_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_match text[];
BEGIN
  IF p_address IS NULL THEN
    RETURN NULL;
  END IF;

  v_match := regexp_match(p_address, '(^|\D)(\d{1,4})([א-תa-zA-Z]?)(\D|$)');
  IF v_match IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN lower(v_match[2] || coalesce(v_match[3], ''));
END;
$$;

CREATE OR REPLACE FUNCTION public.extract_building_street_key(p_address text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
BEGIN
  v := public.normalize_building_address_key(p_address);
  IF v IS NULL THEN
    RETURN NULL;
  END IF;

  v := regexp_replace(v, '(^|\s)\d{1,4}[א-תa-zA-Z]?(\s|$)', ' ', '');
  v := regexp_replace(v, '\s+', ' ', 'g');
  v := trim(v);
  RETURN nullif(v, '');
END;
$$;

CREATE OR REPLACE FUNCTION public.build_geocode_key(p_latitude numeric, p_longitude numeric, p_precision integer DEFAULT 4)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_latitude IS NULL OR p_longitude IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN round(p_latitude, p_precision)::text || ',' || round(p_longitude, p_precision)::text;
END;
$$;

CREATE OR REPLACE FUNCTION public.build_property_building_key(
  p_city text,
  p_address text,
  p_latitude numeric DEFAULT NULL,
  p_longitude numeric DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_city text;
  v_street text;
  v_house text;
  v_geo text;
BEGIN
  v_city := public.normalize_israeli_text_key(p_city);
  v_street := public.extract_building_street_key(p_address);
  v_house := public.extract_building_house_number(p_address);
  v_geo := public.build_geocode_key(p_latitude, p_longitude, 4);

  IF v_city IS NOT NULL AND v_street IS NOT NULL AND v_house IS NOT NULL THEN
    RETURN 'addr:' || v_city || '|' || v_street || '|' || v_house;
  END IF;

  IF v_city IS NOT NULL AND v_geo IS NOT NULL THEN
    RETURN 'geo:' || v_city || '|' || v_geo;
  END IF;

  IF v_city IS NOT NULL AND v_street IS NOT NULL THEN
    RETURN 'street:' || v_city || '|' || v_street;
  END IF;

  RETURN NULL;
END;
$$;

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS normalized_city_key text,
  ADD COLUMN IF NOT EXISTS normalized_street_key text,
  ADD COLUMN IF NOT EXISTS normalized_house_number text,
  ADD COLUMN IF NOT EXISTS normalized_address_key text,
  ADD COLUMN IF NOT EXISTS geocode_key text,
  ADD COLUMN IF NOT EXISTS building_key text,
  ADD COLUMN IF NOT EXISTS building_key_source text,
  ADD COLUMN IF NOT EXISTS building_identity_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.import_job_items
  ADD COLUMN IF NOT EXISTS normalized_city_key text,
  ADD COLUMN IF NOT EXISTS normalized_address_key text,
  ADD COLUMN IF NOT EXISTS geocode_key text,
  ADD COLUMN IF NOT EXISTS building_key text;

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
BEGIN
  v_city := public.normalize_israeli_text_key(NEW.city);
  v_street := public.extract_building_street_key(NEW.address);
  v_house := public.extract_building_house_number(NEW.address);
  v_address := public.normalize_building_address_key(NEW.address);
  v_geo := public.build_geocode_key(NEW.latitude, NEW.longitude, 4);
  v_building_key := public.build_property_building_key(NEW.city, NEW.address, NEW.latitude, NEW.longitude);

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
  NEW.building_identity_metadata := coalesce(NEW.building_identity_metadata, '{}'::jsonb) || jsonb_build_object(
    'last_synced_at', now(),
    'has_house_number', v_house IS NOT NULL,
    'has_geocode', v_geo IS NOT NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_property_building_identity ON public.properties;
CREATE TRIGGER trg_sync_property_building_identity
BEFORE INSERT OR UPDATE OF city, address, latitude, longitude
ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.sync_property_building_identity();

UPDATE public.properties
SET address = address
WHERE city IS NOT NULL OR address IS NOT NULL OR latitude IS NOT NULL OR longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_building_key
  ON public.properties(building_key)
  WHERE building_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_city_street_house
  ON public.properties(normalized_city_key, normalized_street_key, normalized_house_number)
  WHERE normalized_city_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_geocode_key
  ON public.properties(geocode_key)
  WHERE geocode_key IS NOT NULL;

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
  same_building_different_unit boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_address text;
  v_building_key text;
  v_geocode_key text;
BEGIN
  IF p_address IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;

  v_norm_address := public.normalize_building_address_key(p_address);
  v_building_key := public.build_property_building_key(p_city, p_address, p_latitude, p_longitude);
  v_geocode_key := public.build_geocode_key(p_latitude, p_longitude, 4);

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.agency_id,
      p.primary_agency_id,
      p.source_url,
      coalesce(p.added_manually, false) as added_manually,
      p.import_source,
      p.floor_number,
      p.apartment_number,
      p.floor,
      p.building_key,
      p.geocode_key,
      (
        CASE
          WHEN v_building_key IS NOT NULL AND p.building_key = v_building_key THEN 45
          WHEN v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key THEN 35
          WHEN v_norm_address IS NOT NULL AND p.normalized_address_key = v_norm_address THEN 35
          WHEN p.address IS NOT NULL AND v_norm_address IS NOT NULL AND public.normalize_building_address_key(p.address) = v_norm_address THEN 30
          WHEN p.address IS NOT NULL AND v_norm_address IS NOT NULL AND (
            position(v_norm_address IN lower(p.address)) > 0
            OR position(lower(p.address) IN v_norm_address) > 0
          ) THEN 20
          ELSE 0
        END
        + CASE
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0002
            AND abs(p.longitude - p_longitude) < 0.0002 THEN 20
          WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
            AND abs(p.latitude - p_latitude) < 0.0005
            AND abs(p.longitude - p_longitude) < 0.0005 THEN 10
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
        + CASE
          WHEN p_floor_number IS NOT NULL AND COALESCE(p.floor_number, p.floor) IS NOT NULL
            AND p_floor_number = COALESCE(p.floor_number, p.floor) THEN 5
          ELSE 0
        END
        + CASE
          WHEN p_apartment_number IS NOT NULL AND p.apartment_number IS NOT NULL
            AND lower(trim(p_apartment_number)) = lower(trim(p.apartment_number)) THEN 15
          ELSE 0
        END
      )::integer AS raw_score,
      (
        (v_building_key IS NOT NULL AND p.building_key = v_building_key)
        OR (v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key)
        OR (v_norm_address IS NOT NULL AND p.normalized_address_key = v_norm_address)
      ) AS same_building_evidence
    FROM public.properties p
    WHERE p.is_published = true
      AND coalesce(p.primary_agency_id, p.agency_id) IS NOT NULL
      AND coalesce(p.primary_agency_id, p.agency_id) != p_attempted_agency_id
      AND lower(p.city) = lower(p_city)
      AND (p_neighborhood IS NULL OR p.neighborhood IS NULL OR lower(p.neighborhood) = lower(p_neighborhood))
      AND (
        (v_building_key IS NOT NULL AND p.building_key = v_building_key)
        OR (v_geocode_key IS NOT NULL AND p.geocode_key = v_geocode_key)
        OR p_latitude IS NULL OR p.latitude IS NULL
        OR (abs(p.latitude - p_latitude) < 0.005 AND abs(p.longitude - p_longitude) < 0.005)
      )
  )
  SELECT
    b.id,
    coalesce(b.primary_agency_id, b.agency_id),
    b.source_url,
    b.added_manually,
    b.import_source,
    CASE
      WHEN (
        (p_floor_number IS NOT NULL AND COALESCE(b.floor_number, b.floor) IS NOT NULL AND p_floor_number != COALESCE(b.floor_number, b.floor))
        OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
            AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
      ) THEN LEAST(b.raw_score, 50)
      ELSE b.raw_score
    END AS similarity_score,
    (
      b.same_building_evidence AND (
        (p_floor_number IS NOT NULL AND COALESCE(b.floor_number, b.floor) IS NOT NULL AND p_floor_number != COALESCE(b.floor_number, b.floor))
        OR (p_apartment_number IS NOT NULL AND b.apartment_number IS NOT NULL
            AND lower(trim(p_apartment_number)) != lower(trim(b.apartment_number)))
      )
    ) AS same_building_different_unit
  FROM base b
  ORDER BY raw_score DESC
  LIMIT 1;
END;
$$;
