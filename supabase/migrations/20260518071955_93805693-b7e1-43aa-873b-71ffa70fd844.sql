UPDATE properties
SET verification_status = 'draft',
    submitted_at = NULL,
    is_published = false
WHERE primary_agency_id = 'd3070000-0000-4000-a000-000000000001';