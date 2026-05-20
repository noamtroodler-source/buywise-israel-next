DELETE FROM public.property_source_observations
WHERE import_job_item_id IN (
  SELECT iji.id FROM public.import_job_items iji
  JOIN public.import_jobs ij ON ij.id = iji.job_id
  WHERE ij.agency_id='dc8d1362-b79d-4417-b82f-d3f94bcd7fc0'
);
DELETE FROM public.properties WHERE primary_agency_id='dc8d1362-b79d-4417-b82f-d3f94bcd7fc0' OR claimed_by_agency_id='dc8d1362-b79d-4417-b82f-d3f94bcd7fc0';
DELETE FROM public.import_jobs WHERE agency_id='dc8d1362-b79d-4417-b82f-d3f94bcd7fc0';