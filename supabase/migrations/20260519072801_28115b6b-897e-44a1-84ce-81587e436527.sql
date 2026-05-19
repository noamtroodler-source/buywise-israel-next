
WITH bad AS (
  SELECT id, url, (duplicate_decision_metadata->>'matched_property_id')::uuid AS matched_id
  FROM import_job_items
  WHERE job_id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d'
    AND duplicate_decision = 'cross_source_enrichment'
)
UPDATE properties p
SET merged_source_urls = COALESCE(
  ARRAY(SELECT unnest(p.merged_source_urls) EXCEPT SELECT b.url FROM bad b WHERE b.matched_id = p.id),
  ARRAY[]::text[]
)
WHERE p.id IN (SELECT matched_id FROM bad);

UPDATE import_job_items
SET status = 'pending',
    property_id = NULL,
    matched_property_id = NULL,
    duplicate_decision = NULL,
    duplicate_decision_band = NULL,
    duplicate_match_scores = '{}'::jsonb,
    duplicate_decision_metadata = '{}'::jsonb,
    duplicate_reason_codes = '{}'::text[],
    duplicate_checked_at = NULL,
    error_message = NULL,
    error_type = NULL
WHERE job_id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d'
  AND duplicate_decision = 'cross_source_enrichment';

UPDATE import_jobs
SET status = 'processing',
    processed_count = GREATEST(0, processed_count - 4)
WHERE id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d';
