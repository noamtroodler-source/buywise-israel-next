UPDATE public.import_jobs
SET status = 'failed',
    failure_reason = COALESCE(failure_reason, '') || ' [reset by admin]',
    updated_at = now()
WHERE agency_id = '93133b05-62d3-4311-ac95-eda087aaf447'
  AND status IN ('discovering','processing','ready','paused','pending');

DELETE FROM public.properties
WHERE primary_agency_id = '93133b05-62d3-4311-ac95-eda087aaf447';

UPDATE public.agency_sources
SET last_synced_at = NULL,
    last_sync_job_id = NULL,
    last_sync_listings_found = NULL,
    consecutive_failures = 0,
    last_failure_reason = NULL,
    updated_at = now()
WHERE agency_id = '93133b05-62d3-4311-ac95-eda087aaf447';