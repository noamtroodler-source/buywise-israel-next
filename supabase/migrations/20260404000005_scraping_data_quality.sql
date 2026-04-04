-- ============================================================
-- BuyWiseIsrael: Scraping data quality improvements
-- Stores original Israeli room count from source listing,
-- fixes data gaps in scraped properties.
-- ============================================================

-- Store the original Israeli room count (חדרים) as shown on source site.
-- This is bedrooms + living room + other rooms (Israeli standard).
-- We need this separately from our split bedrooms/additional_rooms
-- because most scraped sites only provide total rooms, not the split.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS source_rooms NUMERIC DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_rooms_label TEXT DEFAULT NULL;
  -- e.g. source_rooms=4, source_rooms_label="4 חדרים" or "4 rooms"

-- Index for spec-based comps using source_rooms
CREATE INDEX IF NOT EXISTS idx_properties_source_rooms 
  ON public.properties(city, source_rooms, size_sqm) 
  WHERE source_rooms IS NOT NULL AND is_published = true;

-- Fix: when bedrooms=0 AND source_rooms is set, derive bedrooms from source_rooms
-- This is a one-time backfill for existing scraped listings
UPDATE public.properties
SET bedrooms = GREATEST(0, FLOOR(source_rooms) - 1)
WHERE source_rooms IS NOT NULL 
  AND (bedrooms IS NULL OR bedrooms = 0)
  AND import_source IS NOT NULL;
