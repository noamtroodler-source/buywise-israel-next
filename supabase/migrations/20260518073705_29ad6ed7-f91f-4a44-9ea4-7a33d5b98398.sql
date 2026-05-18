WITH target_listings AS (
  SELECT
    p.id,
    p.primary_agency_id,
    row_number() OVER (PARTITION BY p.primary_agency_id ORDER BY p.created_at DESC, p.id) AS rn
  FROM public.properties p
  WHERE p.primary_agency_id IN (
    '3bb23813-2c1c-416a-88e6-aae7afc81b89'::uuid,
    'd3070000-0000-4000-a000-000000000001'::uuid
  )
), agency_agents AS (
  SELECT agency_id, array_agg(id ORDER BY name) AS agent_ids
  FROM public.agents
  WHERE agency_id IN (
    '3bb23813-2c1c-416a-88e6-aae7afc81b89'::uuid,
    'd3070000-0000-4000-a000-000000000001'::uuid
  )
  GROUP BY agency_id
), prepared AS (
  SELECT
    t.*,
    aa.agent_ids,
    ARRAY['Lev Hair','Neve Tzedek','Old North','Florentin','Bavli','Ramat Aviv','Kerem HaTeimanim','Park Tzameret','Jaffa','Ramat Aviv Gimel'] AS neighborhoods,
    ARRAY['Dizengoff','Rothschild','Ben Yehuda','Bograshov','Allenby','Ibn Gabirol','Arlozorov','Frishman','Yehuda HaMaccabi','HaYarkon'] AS streets,
    ARRAY[
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200',
      'https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=1200'
    ]::text[] AS demo_images
  FROM target_listings t
  JOIN agency_agents aa ON aa.agency_id = t.primary_agency_id
)
UPDATE public.properties p
SET
  title = CASE (prepared.rn - 1) % 12
    WHEN 0 THEN 'Renovated 4-Room Apartment Near Rothschild'
    WHEN 1 THEN 'Garden Penthouse with Sea View'
    WHEN 2 THEN 'Family Apartment by Park Hayarkon'
    WHEN 3 THEN '3-Room Apartment in Florentin'
    WHEN 4 THEN 'Duplex with Balcony in Bavli'
    WHEN 5 THEN 'Investment Apartment in Kerem HaTeimanim'
    WHEN 6 THEN 'Modern 4-Room in Park Tzameret'
    WHEN 7 THEN 'Classic Old North Apartment'
    WHEN 8 THEN 'Bright Jaffa Apartment Near the Flea Market'
    WHEN 9 THEN 'Penthouse Rental Near Rabin Square'
    WHEN 10 THEN 'Furnished Rental by Dizengoff Center'
    ELSE 'Quiet Ramat Aviv Rental Apartment'
  END,
  description = 'Demo onboarding listing for the agency review workflow. The agency should confirm the details before submitting it for BuyWise review.',
  property_type = CASE
    WHEN prepared.rn IN (2, 10, 20, 30) THEN 'penthouse'::property_type
    WHEN prepared.rn IN (5, 18, 28) THEN 'duplex'::property_type
    WHEN prepared.rn IN (12, 24, 32) THEN 'garden_apartment'::property_type
    ELSE 'apartment'::property_type
  END,
  listing_status = CASE WHEN prepared.rn <= 24 THEN 'for_sale'::listing_status ELSE 'for_rent'::listing_status END,
  price = CASE
    WHEN prepared.rn <= 24 THEN (2450000 + (prepared.rn * 185000) + ((prepared.rn % 5) * 275000))::numeric
    ELSE (7200 + ((prepared.rn - 24) * 850))::numeric
  END,
  currency = 'ILS',
  address = prepared.streets[((prepared.rn - 1) % array_length(prepared.streets, 1)) + 1] || ' ' || (10 + prepared.rn)::text || ', Tel Aviv',
  city = 'Tel Aviv',
  neighborhood = CASE
    WHEN prepared.rn > 3 AND prepared.rn % 4 = 0 THEN NULL
    WHEN prepared.rn > 3 AND prepared.rn % 11 = 0 THEN NULL
    ELSE prepared.neighborhoods[((prepared.rn - 1) % array_length(prepared.neighborhoods, 1)) + 1]
  END,
  bedrooms = CASE WHEN prepared.rn <= 3 THEN 3 ELSE 1 + (prepared.rn % 4) END,
  bathrooms = CASE
    WHEN prepared.rn > 3 AND prepared.rn % 6 = 0 THEN NULL
    WHEN prepared.rn > 3 AND prepared.rn % 13 = 0 THEN NULL
    ELSE 1 + (prepared.rn % 3)
  END,
  size_sqm = CASE
    WHEN prepared.rn > 3 AND prepared.rn % 5 = 0 THEN NULL
    WHEN prepared.rn > 3 AND prepared.rn % 11 = 0 THEN NULL
    ELSE (48 + (prepared.rn * 4))::numeric
  END,
  floor = CASE
    WHEN prepared.rn > 3 AND prepared.rn % 7 = 0 THEN NULL
    WHEN prepared.rn > 3 AND prepared.rn % 13 = 0 THEN NULL
    ELSE prepared.rn % 18
  END,
  total_floors = 18,
  images = prepared.demo_images,
  agent_id = prepared.agent_ids[((prepared.rn - 1) % array_length(prepared.agent_ids, 1)) + 1],
  import_source = COALESCE(p.import_source, 'demo_onboarding'),
  source_agency_name = COALESCE(p.source_agency_name, 'Demo onboarding import'),
  is_published = false,
  verification_status = 'draft'::verification_status,
  submitted_at = NULL,
  reviewed_at = NULL,
  reviewed_by = NULL,
  rejection_reason = NULL,
  admin_notes = NULL,
  data_quality_score = CASE WHEN prepared.rn <= 3 THEN 92 ELSE 68 END,
  updated_at = now()
FROM prepared
WHERE p.id = prepared.id;

INSERT INTO public.listing_agency_reviews (
  property_id,
  agency_id,
  status,
  reviewed_at,
  reviewed_by,
  review_notes,
  skipped_at,
  updated_at
)
SELECT
  p.id,
  p.primary_agency_id,
  'needs_review',
  NULL,
  NULL,
  NULL,
  NULL,
  now()
FROM public.properties p
WHERE p.primary_agency_id IN (
  '3bb23813-2c1c-416a-88e6-aae7afc81b89'::uuid,
  'd3070000-0000-4000-a000-000000000001'::uuid
)
ON CONFLICT (property_id) DO UPDATE
SET
  agency_id = EXCLUDED.agency_id,
  status = 'needs_review',
  reviewed_at = NULL,
  reviewed_by = NULL,
  review_notes = NULL,
  skipped_at = NULL,
  updated_at = now();