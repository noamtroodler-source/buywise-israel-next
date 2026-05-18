WITH target_listings AS (
  SELECT
    p.id,
    row_number() OVER (PARTITION BY p.primary_agency_id ORDER BY p.created_at DESC, p.id) AS rn
  FROM public.properties p
  WHERE p.primary_agency_id IN (
    '3bb23813-2c1c-416a-88e6-aae7afc81b89'::uuid,
    'd3070000-0000-4000-a000-000000000001'::uuid
  )
)
UPDATE public.properties p
SET
  neighborhood = CASE
    WHEN target_listings.rn = 1 THEN 'Lev Hair'
    WHEN target_listings.rn = 2 THEN 'Neve Tzedek'
    WHEN target_listings.rn = 3 THEN 'Old North'
    ELSE NULL
  END,
  bathrooms = CASE WHEN target_listings.rn <= 3 THEN COALESCE(p.bathrooms, 2) ELSE p.bathrooms END,
  size_sqm = CASE WHEN target_listings.rn <= 3 THEN COALESCE(p.size_sqm, 90) ELSE p.size_sqm END,
  floor = CASE WHEN target_listings.rn <= 3 THEN COALESCE(p.floor, 3) ELSE p.floor END,
  is_published = false,
  verification_status = 'draft'::verification_status,
  submitted_at = NULL,
  updated_at = now()
FROM target_listings
WHERE p.id = target_listings.id;