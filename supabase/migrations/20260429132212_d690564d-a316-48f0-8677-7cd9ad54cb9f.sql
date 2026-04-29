UPDATE public.properties
SET
  is_published = false,
  verification_status = 'pending_review',
  provisioning_audit_status = 'flagged',
  updated_at = now()
WHERE (primary_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89' OR claimed_by_agency_id = '3bb23813-2c1c-416a-88e6-aae7afc81b89')
  AND (address IS NULL OR btrim(address) = '' OR address !~ '[0-9]');