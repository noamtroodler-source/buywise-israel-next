CREATE OR REPLACE FUNCTION public.sync_property_source_observation_from_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_type text;
  v_source_item_id text;
BEGIN
  IF NEW.source_url IS NULL OR NEW.import_source IS NULL THEN
    RETURN NEW;
  END IF;

  v_source_type := public.normalize_listing_source_type(NEW.import_source, NEW.source_url);
  v_source_item_id := NEW.source_item_id;

  PERFORM public.record_property_source_observation(
    p_property_id := NEW.id,
    p_agency_id := coalesce(NEW.primary_agency_id, NEW.claimed_by_agency_id),
    p_import_job_id := NULL::uuid,
    p_import_job_item_id := NULL::uuid,
    p_source_type := v_source_type,
    p_source_url := NEW.source_url,
    p_source_item_id := v_source_item_id,
    p_duplicate_decision := CASE WHEN TG_OP = 'INSERT' THEN 'property_created_or_backfilled' ELSE 'property_source_refreshed' END,
    p_duplicate_reason_codes := ARRAY['property_source_sync']::text[],
    p_matched_property_id := NEW.id,
    p_confidence_score := NEW.data_quality_score,
    p_raw_extracted_data := NULL::jsonb,
    p_duplicate_decision_band := CASE WHEN TG_OP = 'INSERT' THEN 'property_created_or_backfilled' ELSE 'property_source_refreshed' END,
    p_duplicate_match_scores := '{}'::jsonb,
    p_duplicate_decision_metadata := jsonb_build_object('source', 'property_trigger', 'operation', TG_OP)
  );

  RETURN NEW;
END;
$$;

DROP FUNCTION IF EXISTS public.record_property_source_observation(
  uuid,
  uuid,
  uuid,
  uuid,
  text,
  text,
  text,
  text,
  text[],
  uuid,
  integer,
  jsonb
);