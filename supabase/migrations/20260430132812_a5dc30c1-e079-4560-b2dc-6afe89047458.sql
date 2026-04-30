
DO $$
DECLARE
  v_agency UUID := 'd1b1208e-1114-46e8-add2-68da063e0b4c';
  v_job UUID := '7b1e2f83-10f5-4f56-abe4-7f1040c3cdff';
  v_property_ids UUID[];
BEGIN
  -- 1. Pause the bad job so background workers can't continue
  UPDATE public.import_jobs
  SET status = 'paused',
      failure_reason = COALESCE(failure_reason, '') || ' :: paused by admin pending Wix listing gate fix'
  WHERE id = v_job;

  -- 2. Skip remaining queue items so the next process_batch call can't insert more rows
  UPDATE public.import_job_items
  SET status = 'skipped',
      error_type = 'permanent',
      error_message = COALESCE(error_message,'') || ' :: held - Wix listing gate fix in progress'
  WHERE job_id = v_job
    AND status IN ('pending','processing');

  -- 3. Collect properties created by the bad run (today) for this agency
  SELECT array_agg(id) INTO v_property_ids
  FROM public.properties
  WHERE (claimed_by_agency_id = v_agency OR primary_agency_id = v_agency)
    AND created_at >= '2026-04-30 06:00:00+00';

  IF v_property_ids IS NULL THEN
    RAISE NOTICE 'No bad properties to delete';
    RETURN;
  END IF;

  RAISE NOTICE 'Deleting % bad properties', array_length(v_property_ids, 1);

  -- 4. Detach import_job_items references so we keep diagnostics but no FK orphans
  UPDATE public.import_job_items
  SET property_id = NULL,
      matched_property_id = NULL
  WHERE property_id = ANY(v_property_ids) OR matched_property_id = ANY(v_property_ids);

  -- 5. Remove dependent rows that may not cascade
  DELETE FROM public.image_hashes WHERE property_id = ANY(v_property_ids);
  DELETE FROM public.property_source_observations WHERE property_id = ANY(v_property_ids);
  DELETE FROM public.duplicate_pairs WHERE property_a = ANY(v_property_ids) OR property_b = ANY(v_property_ids);

  -- 6. Finally, delete the bad properties
  DELETE FROM public.properties WHERE id = ANY(v_property_ids);
END $$;
