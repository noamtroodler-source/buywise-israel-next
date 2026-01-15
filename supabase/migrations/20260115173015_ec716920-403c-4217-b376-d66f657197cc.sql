-- Add property mix columns to city_canonical_metrics
ALTER TABLE city_canonical_metrics 
  ADD COLUMN IF NOT EXISTS resale_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS new_projects_percent NUMERIC,
  ADD COLUMN IF NOT EXISTS rentals_percent NUMERIC;

-- Add comment for documentation
COMMENT ON COLUMN city_canonical_metrics.resale_percent IS 'Percentage of market listings that are resale/secondhand properties';
COMMENT ON COLUMN city_canonical_metrics.new_projects_percent IS 'Percentage of market listings that are new construction/developer projects';
COMMENT ON COLUMN city_canonical_metrics.rentals_percent IS 'Percentage of market listings that are long-term rentals';