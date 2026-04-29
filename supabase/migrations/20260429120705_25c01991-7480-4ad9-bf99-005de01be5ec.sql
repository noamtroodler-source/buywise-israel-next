-- Phase 5: structured duplicate decision bands and scores

ALTER TABLE public.import_job_items
  ADD COLUMN IF NOT EXISTS duplicate_decision_band text,
  ADD COLUMN IF NOT EXISTS duplicate_match_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duplicate_decision_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.property_source_observations
  ADD COLUMN IF NOT EXISTS duplicate_decision_band text,
  ADD COLUMN IF NOT EXISTS duplicate_match_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS duplicate_decision_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_import_job_items_duplicate_band
  ON public.import_job_items(duplicate_decision_band, duplicate_checked_at DESC)
  WHERE duplicate_decision_band IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_source_observations_duplicate_band
  ON public.property_source_observations(duplicate_decision_band, last_seen_at DESC)
  WHERE duplicate_decision_band IS NOT NULL;

CREATE OR REPLACE FUNCTION public.record_property_source_observation(
  p_property_id uuid,
  p_agency_id uuid,
  p_import_job_id uuid,
  p_import_job_item_id uuid,
  p_source_type text,
  p_source_url text,
  p_source_item_id text DEFAULT NULL,
  p_duplicate_decision text DEFAULT NULL,
  p_duplicate_reason_codes text[] DEFAULT ARRAY[]::text[],
  p_matched_property_id uuid DEFAULT NULL,
  p_confidence_score integer DEFAULT NULL,
  p_raw_extracted_data jsonb DEFAULT NULL,
  p_duplicate_decision_band text DEFAULT NULL,
  p_duplicate_match_scores jsonb DEFAULT '{}'::jsonb,
  p_duplicate_decision_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_type text;
  v_canonical_url text;
  v_source_identity_key text;
  v_source_domain text;
  v_observation_id uuid;
BEGIN
  IF p_source_url IS NULL OR length(trim(p_source_url)) = 0 THEN
    RETURN NULL;
  END IF;

  v_source_type := public.normalize_listing_source_type(p_source_type, p_source_url);
  v_canonical_url := public.normalize_url(p_source_url);
  v_source_identity_key := public.build_source_identity_key(v_source_type, p_source_url, p_source_item_id);

  IF v_source_identity_key IS NULL THEN
    RETURN NULL;
  END IF;

  v_source_domain := CASE
    WHEN v_canonical_url IS NULL THEN NULL
    ELSE lower(regexp_replace(v_canonical_url, '^https?://([^/]+).*$','\1'))
  END;

  IF p_agency_id IS NOT NULL THEN
    SELECT id INTO v_observation_id
    FROM public.property_source_observations
    WHERE agency_id = p_agency_id
      AND source_identity_key = v_source_identity_key
    LIMIT 1;
  ELSE
    SELECT id INTO v_observation_id
    FROM public.property_source_observations
    WHERE agency_id IS NULL
      AND source_identity_key = v_source_identity_key
    LIMIT 1;
  END IF;

  IF v_observation_id IS NULL THEN
    INSERT INTO public.property_source_observations (
      property_id,
      agency_id,
      import_job_id,
      import_job_item_id,
      source_type,
      source_url,
      canonical_source_url,
      source_domain,
      source_item_id,
      source_identity_key,
      last_seen_at,
      last_scraped_at,
      observation_status,
      duplicate_decision,
      duplicate_reason_codes,
      matched_property_id,
      confidence_score,
      raw_extracted_data,
      duplicate_decision_band,
      duplicate_match_scores,
      duplicate_decision_metadata
    ) VALUES (
      p_property_id,
      p_agency_id,
      p_import_job_id,
      p_import_job_item_id,
      v_source_type,
      p_source_url,
      v_canonical_url,
      v_source_domain,
      nullif(trim(coalesce(p_source_item_id, '')), ''),
      v_source_identity_key,
      now(),
      now(),
      'active',
      p_duplicate_decision,
      coalesce(p_duplicate_reason_codes, ARRAY[]::text[]),
      p_matched_property_id,
      p_confidence_score,
      p_raw_extracted_data,
      p_duplicate_decision_band,
      coalesce(p_duplicate_match_scores, '{}'::jsonb),
      coalesce(p_duplicate_decision_metadata, '{}'::jsonb)
    ) RETURNING id INTO v_observation_id;
  ELSE
    UPDATE public.property_source_observations
    SET property_id = coalesce(p_property_id, property_source_observations.property_id),
        import_job_id = coalesce(p_import_job_id, property_source_observations.import_job_id),
        import_job_item_id = coalesce(p_import_job_item_id, property_source_observations.import_job_item_id),
        source_type = v_source_type,
        source_url = p_source_url,
        canonical_source_url = v_canonical_url,
        source_domain = v_source_domain,
        source_item_id = coalesce(nullif(trim(coalesce(p_source_item_id, '')), ''), property_source_observations.source_item_id),
        last_seen_at = now(),
        last_scraped_at = now(),
        observation_status = 'active',
        duplicate_decision = coalesce(p_duplicate_decision, property_source_observations.duplicate_decision),
        duplicate_reason_codes = coalesce(p_duplicate_reason_codes, property_source_observations.duplicate_reason_codes, ARRAY[]::text[]),
        matched_property_id = coalesce(p_matched_property_id, property_source_observations.matched_property_id),
        confidence_score = coalesce(p_confidence_score, property_source_observations.confidence_score),
        raw_extracted_data = coalesce(p_raw_extracted_data, property_source_observations.raw_extracted_data),
        duplicate_decision_band = coalesce(p_duplicate_decision_band, property_source_observations.duplicate_decision_band),
        duplicate_match_scores = coalesce(p_duplicate_match_scores, property_source_observations.duplicate_match_scores, '{}'::jsonb),
        duplicate_decision_metadata = coalesce(p_duplicate_decision_metadata, property_source_observations.duplicate_decision_metadata, '{}'::jsonb),
        updated_at = now()
    WHERE id = v_observation_id;
  END IF;

  RETURN v_observation_id;
END;
$$;