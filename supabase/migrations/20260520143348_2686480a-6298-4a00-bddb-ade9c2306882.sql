DO $$
DECLARE
  v_agency_id uuid := 'd074117b-65a9-4fe6-8251-8f93eefada24';
BEGIN
  DELETE FROM properties WHERE primary_agency_id = v_agency_id;

  UPDATE import_job_items ji
  SET status = 'pending',
      property_id = NULL,
      matched_property_id = NULL,
      source_identity_key = NULL,
      canonical_source_url = NULL,
      error_message = NULL,
      error_type = NULL,
      duplicate_decision = NULL,
      duplicate_checked_at = NULL
  FROM import_jobs ij
  WHERE ji.job_id = ij.id
    AND ij.agency_id = v_agency_id;
END $$;