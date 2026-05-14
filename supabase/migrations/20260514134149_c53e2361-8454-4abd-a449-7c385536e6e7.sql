DO $$
DECLARE
  v_agency_id uuid := '93133b05-62d3-4311-ac95-eda087aaf447';
BEGIN
  DELETE FROM import_job_items WHERE job_id IN (SELECT id FROM import_jobs WHERE agency_id = v_agency_id);
  DELETE FROM import_job_costs WHERE job_id IN (SELECT id FROM import_jobs WHERE agency_id = v_agency_id);
  DELETE FROM import_jobs WHERE agency_id = v_agency_id;

  DELETE FROM import_conflicts WHERE agency_id = v_agency_id;

  DELETE FROM properties
  WHERE primary_agency_id = v_agency_id
     OR claimed_by_agency_id = v_agency_id;
END $$;