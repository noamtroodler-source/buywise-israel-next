UPDATE properties
SET verification_status = 'approved',
    is_published = true,
    submitted_at = COALESCE(submitted_at, now()),
    reviewed_at = now()
WHERE (primary_agency_id = '93133b05-62d3-4311-ac95-eda087aaf447'
       OR claimed_by_agency_id = '93133b05-62d3-4311-ac95-eda087aaf447')
  AND verification_status = 'draft'
  AND COALESCE(array_length(images, 1), 0) >= 4;