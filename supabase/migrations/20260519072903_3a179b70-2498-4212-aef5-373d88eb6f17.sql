
-- Restore source identity to point at each property's own source_url
UPDATE properties
SET canonical_source_url = source_url,
    source_identity_key = 'website:url:' || source_url,
    source_identity_reason = 'restored_after_bad_merge'
WHERE id IN (
  '94caeea8-0679-4407-8d75-d6116f1e6006',
  'ad05853d-6adb-47ca-b528-478b0e2a7ab4',
  'e9150a85-a529-4aee-891f-5d339312ee83'
);

-- Reset the 3 items still wrongly matched so the stricter matcher creates them anew
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
    error_type = NULL,
    source_identity_key = 'website:url:' || url,
    canonical_source_url = url
WHERE job_id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d'
  AND url IN (
    'https://aliyahrealty.com/realty/abaye',
    'https://aliyahrealty.com/realty/spacious-3-room-for-sale-in-ramat-beit-shemesh-a-dolev',
    'https://aliyahrealty.com/realty/beautifully-upgraded-3-room-option-to-expand-for-sale-on-dolev-ramat-beit-shemesh-a'
  );

UPDATE import_jobs
SET status = 'processing'
WHERE id = '1c24f6c7-2beb-45e0-83ec-15e4d00e3b8d';
