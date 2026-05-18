
-- Delete properties created via Gordon Realty import jobs
DELETE FROM public.properties
WHERE id IN (
  SELECT i.property_id
  FROM public.import_job_items i
  JOIN public.import_jobs j ON j.id = i.job_id
  WHERE j.agency_id = 'dc8d1362-b79d-4417-b82f-d3f94bcd7fc0'
    AND i.property_id IS NOT NULL
);

-- Clear last_sync reference on agency_sources for this agency
UPDATE public.agency_sources
SET last_sync_job_id = NULL, last_synced_at = NULL
WHERE agency_id = 'dc8d1362-b79d-4417-b82f-d3f94bcd7fc0';

-- Delete the import jobs themselves (items + costs cascade)
DELETE FROM public.import_jobs
WHERE agency_id = 'dc8d1362-b79d-4417-b82f-d3f94bcd7fc0';
