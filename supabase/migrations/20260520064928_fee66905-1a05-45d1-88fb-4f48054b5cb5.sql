-- Reset Erez Real Estate website-import items that all collapsed onto one property
-- due to the canonical-identity bug. Keep one item bound to the existing property;
-- free the other 6 so the next import creates distinct properties.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS rn
  FROM import_job_items
  WHERE job_id = 'f21f3efd-2980-4a56-8bae-eed14d6aac8b'
    AND status = 'done'
)
UPDATE import_job_items
SET status = 'pending',
    property_id = NULL,
    source_identity_key = NULL,
    canonical_source_url = NULL
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);