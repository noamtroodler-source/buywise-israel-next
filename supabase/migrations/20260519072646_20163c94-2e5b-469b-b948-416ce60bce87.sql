
UPDATE import_job_items
SET duplicate_reason_codes = '{}'::text[]
WHERE job_id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d'
  AND status = 'pending'
  AND duplicate_reason_codes IS NULL;
