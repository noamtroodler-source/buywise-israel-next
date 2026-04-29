-- Phase 6: richer duplicate reason-code coverage

CREATE OR REPLACE FUNCTION public.normalize_duplicate_reason_codes(
  p_codes text[] DEFAULT ARRAY[]::text[],
  p_decision_band text DEFAULT NULL,
  p_scores jsonb DEFAULT '{}'::jsonb,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_codes text[] := ARRAY[]::text[];
  v_code text;
  v_same_building_score integer := coalesce(nullif(p_scores->>'same_building_score', '')::integer, 0);
  v_same_unit_score integer := coalesce(nullif(p_scores->>'same_unit_score', '')::integer, 0);
BEGIN
  FOREACH v_code IN ARRAY coalesce(p_codes, ARRAY[]::text[]) LOOP
    IF v_code IS NOT NULL AND length(trim(v_code)) > 0 THEN
      v_codes := array_append(v_codes, lower(regexp_replace(trim(v_code), '[^a-zA-Z0-9_]+', '_', 'g')));
    END IF;
  END LOOP;

  IF p_decision_band IS NOT NULL THEN
    v_codes := array_append(v_codes, 'band_' || lower(regexp_replace(trim(p_decision_band), '[^a-zA-Z0-9_]+', '_', 'g')));
  END IF;

  IF v_same_building_score >= 65 THEN
    v_codes := array_append(v_codes, 'same_building_strong');
  ELSIF v_same_building_score > 0 THEN
    v_codes := array_append(v_codes, 'same_building_weak');
  END IF;

  IF v_same_unit_score >= 75 THEN
    v_codes := array_append(v_codes, 'same_unit_strong');
  ELSIF v_same_unit_score >= 45 THEN
    v_codes := array_append(v_codes, 'same_unit_possible');
  ELSIF v_same_unit_score > 0 THEN
    v_codes := array_append(v_codes, 'same_unit_weak');
  END IF;

  IF coalesce(p_metadata->>'action', '') <> '' THEN
    v_codes := array_append(v_codes, 'action_' || lower(regexp_replace(trim(p_metadata->>'action'), '[^a-zA-Z0-9_]+', '_', 'g')));
  END IF;

  SELECT coalesce(array_agg(DISTINCT c ORDER BY c), ARRAY[]::text[])
  INTO v_codes
  FROM unnest(v_codes) AS c
  WHERE c IS NOT NULL AND length(c) > 0;

  RETURN v_codes;
END;
$$;

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
  v_entrance text;
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
  v_entrance := v_unit->>'entrance';
  v_unit_key := public.build_property_unit_identity_key(v_building_key, v_floor, v_apartment, v_entrance);

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
        + CASE WHEN v_entrance IS NOT NULL AND p.normalized_entrance IS NOT NULL AND p.normalized_entrance = v_entrance THEN 8 ELSE 0 END
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
        CASE WHEN v_apartment IS NOT NULL AND p.normalized_apartment_number IS NOT NULL AND p.normalized_apartment_number <> v_apartment THEN 'different_apartment_number' END,
        CASE WHEN v_apartment IS NULL THEN 'incoming_missing_apartment_number' END,
        CASE WHEN p.normalized_apartment_number IS NULL THEN 'existing_missing_apartment_number' END,
        CASE WHEN v_floor IS NOT NULL AND p.normalized_floor_number IS NOT NULL AND p.normalized_floor_number = v_floor THEN 'same_floor' END,
        CASE WHEN v_floor IS NOT NULL AND p.normalized_floor_number IS NOT NULL AND p.normalized_floor_number <> v_floor THEN 'different_floor' END,
        CASE WHEN v_floor IS NULL THEN 'incoming_missing_floor' END,
        CASE WHEN p.normalized_floor_number IS NULL THEN 'existing_missing_floor' END,
        CASE WHEN v_entrance IS NOT NULL AND p.normalized_entrance IS NOT NULL AND p.normalized_entrance = v_entrance THEN 'same_entrance' END,
        CASE WHEN v_entrance IS NOT NULL AND p.normalized_entrance IS NOT NULL AND p.normalized_entrance <> v_entrance THEN 'different_entrance' END,
        CASE WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL AND abs(p.size_sqm - p_size_sqm) <= 3 THEN 'size_within_3_sqm' END,
        CASE WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL AND abs(p.size_sqm - p_size_sqm) > 3 AND abs(p.size_sqm - p_size_sqm) <= 7 THEN 'size_within_7_sqm' END,
        CASE WHEN p_size_sqm IS NULL THEN 'incoming_missing_size' END,
        CASE WHEN p.size_sqm IS NULL THEN 'existing_missing_size' END,
        CASE WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL AND p.bedrooms = p_bedrooms THEN 'bedrooms_match' END,
        CASE WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL AND p.bedrooms <> p_bedrooms THEN 'bedrooms_conflict' END,
        CASE WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0 AND abs(p.price - p_price) / greatest(p.price, p_price) <= 0.03 THEN 'price_within_3_percent' END,
        CASE WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0 AND abs(p.price - p_price) / greatest(p.price, p_price) > 0.03 AND abs(p.price - p_price) / greatest(p.price, p_price) <= 0.07 THEN 'price_within_7_percent' END,
        CASE WHEN p_price IS NULL THEN 'incoming_missing_price' END,
        CASE WHEN p.price IS NULL OR p.price <= 0 THEN 'existing_missing_price' END
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
          OR (v_entrance IS NOT NULL AND c.normalized_entrance IS NOT NULL AND c.normalized_entrance <> v_entrance)
        ) THEN true
        ELSE false
      END AS different_unit_evidence
    FROM candidates c
  ), banded AS (
    SELECT
      s.*,
      CASE
        WHEN s.different_unit_evidence THEN 'same_building_likely_different_unit'
        WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc >= 75 THEN 'high_confidence_same_unit'
        WHEN s.same_building_score_calc >= 65 AND s.same_unit_score_calc BETWEEN 45 AND 74 THEN 'possible_same_unit'
        WHEN s.same_building_score_calc >= 65 THEN 'same_building_insufficient_unit_evidence'
        ELSE 'no_match'
      END AS decision_band,
      CASE
        WHEN s.different_unit_evidence THEN least((s.same_building_score_calc + s.same_unit_score_calc), 55)
        ELSE least((s.same_building_score_calc + s.same_unit_score_calc), 100)
      END::integer AS final_similarity_score
    FROM scored s
  )
  SELECT
    b.id,
    b.existing_agency,
    b.source_url,
    coalesce(b.added_manually, false),
    b.import_source,
    b.final_similarity_score,
    b.different_unit_evidence AS same_building_different_unit,
    b.same_building_score_calc::integer AS same_building_score,
    b.same_unit_score_calc::integer AS same_unit_score,
    b.decision_band AS duplicate_decision_band,
    public.normalize_duplicate_reason_codes(
      b.reasons,
      b.decision_band,
      jsonb_build_object(
        'same_building_score', b.same_building_score_calc,
        'same_unit_score', b.same_unit_score_calc,
        'similarity_score', b.final_similarity_score
      ),
      jsonb_build_object(
        'matched_property_id', b.id,
        'same_building_different_unit', b.different_unit_evidence
      )
    ) AS duplicate_reason_codes
  FROM banded b
  WHERE b.same_building_score_calc >= 65 OR b.same_unit_score_calc >= 45
  ORDER BY
    CASE
      WHEN b.different_unit_evidence THEN 1
      WHEN b.same_building_score_calc >= 65 AND b.same_unit_score_calc >= 75 THEN 4
      WHEN b.same_building_score_calc >= 65 AND b.same_unit_score_calc >= 45 THEN 3
      ELSE 2
    END DESC,
    (b.same_building_score_calc + b.same_unit_score_calc) DESC
  LIMIT 1;
END;
$$;

UPDATE public.import_job_items
SET duplicate_reason_codes = public.normalize_duplicate_reason_codes(
      duplicate_reason_codes,
      duplicate_decision_band,
      duplicate_match_scores,
      duplicate_decision_metadata
    )
WHERE duplicate_decision IS NOT NULL OR duplicate_decision_band IS NOT NULL;

UPDATE public.property_source_observations
SET duplicate_reason_codes = public.normalize_duplicate_reason_codes(
      duplicate_reason_codes,
      duplicate_decision_band,
      duplicate_match_scores,
      duplicate_decision_metadata
    )
WHERE duplicate_decision IS NOT NULL OR duplicate_decision_band IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_job_items_duplicate_reason_codes
  ON public.import_job_items USING gin (duplicate_reason_codes);

CREATE INDEX IF NOT EXISTS idx_property_source_observations_duplicate_reason_codes
  ON public.property_source_observations USING gin (duplicate_reason_codes);