ALTER TABLE public.import_jobs
  DROP CONSTRAINT IF EXISTS import_jobs_status_check;

ALTER TABLE public.import_jobs
  ADD CONSTRAINT import_jobs_status_check
  CHECK (status IN ('discovering', 'ready', 'processing', 'paused', 'completed', 'failed'));

UPDATE public.import_jobs
SET status = 'paused', last_heartbeat = NULL
WHERE agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89'
  AND status IN ('discovering', 'ready', 'processing');

UPDATE public.import_job_items
SET status = 'pending', error_message = NULL, error_type = NULL
WHERE job_id IN (
  SELECT id
  FROM public.import_jobs
  WHERE agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89'
    AND status = 'paused'
)
  AND status = 'processing';