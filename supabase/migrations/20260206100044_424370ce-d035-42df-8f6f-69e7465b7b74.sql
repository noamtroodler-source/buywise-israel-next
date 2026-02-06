-- Add featured_neighborhoods column for curated neighborhood content
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS featured_neighborhoods JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN cities.featured_neighborhoods IS 
  'Curated neighborhood highlights for Market Environment pages. Separate from boundary tessellation data.';