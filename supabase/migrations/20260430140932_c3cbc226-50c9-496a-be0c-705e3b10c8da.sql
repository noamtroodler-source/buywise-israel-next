-- Repair bad numeric fields on the 2 Ashkelon listings affected by the pre-fix scraper bug.
-- 1) Marina apartment: bedrooms 1.35M leaked from price; AI title says "One-bedroom".
UPDATE public.properties
SET bedrooms = 1
WHERE id = 'afcb5c30-421c-41e0-bb96-5eeee908c3eb' AND bedrooms > 12;

-- 2) High-floor Ashkelon apt: size_sqm = 35 was the balcony, not the unit. Clear it (better null than wrong).
UPDATE public.properties
SET size_sqm = NULL
WHERE id = '6d3efb33-f462-482a-ba87-dfd33780f8c7' AND size_sqm = 35;

-- Defensive sweep: any property with absurd bedroom counts (likely price leak) → null.
UPDATE public.properties
SET bedrooms = NULL
WHERE bedrooms IS NOT NULL AND (bedrooms > 12 OR bedrooms < 0);