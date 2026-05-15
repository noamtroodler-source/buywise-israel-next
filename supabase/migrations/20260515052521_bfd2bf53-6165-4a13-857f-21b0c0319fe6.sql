DO $$
DECLARE
  aid uuid := 'a2c77541-753b-4e17-a368-e454e17ad8d4';
BEGIN
  DELETE FROM public.import_job_costs WHERE job_id IN (SELECT id FROM public.import_jobs WHERE agency_id = aid);
  DELETE FROM public.import_job_items WHERE job_id IN (SELECT id FROM public.import_jobs WHERE agency_id = aid);
  DELETE FROM public.import_jobs WHERE agency_id = aid;
  DELETE FROM public.properties WHERE primary_agency_id = aid OR claimed_by_agency_id = aid;
END $$;