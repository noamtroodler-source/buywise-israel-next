-- Add new columns to historical_prices table for richer data
ALTER TABLE public.historical_prices 
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS data_level text CHECK (data_level IN ('city', 'district'));

-- Add index for faster city lookups
CREATE INDEX IF NOT EXISTS idx_historical_prices_city_year ON public.historical_prices(city, year);

-- Create city_market_cycles table for cycle analysis
CREATE TABLE IF NOT EXISTS public.city_market_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL REFERENCES public.cities(slug) ON DELETE CASCADE,
  period_start INTEGER NOT NULL,
  period_end INTEGER NOT NULL,
  cycle_name TEXT NOT NULL,
  total_growth_percent NUMERIC,
  avg_annual_growth NUMERIC,
  notes TEXT,
  sort_order INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(city_slug, period_start, period_end)
);

-- Enable RLS on city_market_cycles
ALTER TABLE public.city_market_cycles ENABLE ROW LEVEL SECURITY;

-- Public read access for market cycles (reference data)
CREATE POLICY "Market cycles are publicly readable"
ON public.city_market_cycles
FOR SELECT
USING (true);

-- Add historical data quality metadata to cities table
ALTER TABLE public.cities
ADD COLUMN IF NOT EXISTS historical_data_notes JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.historical_prices.source IS 'Citation for this year''s data (e.g., CBS Housing Price Index Q3 2025)';
COMMENT ON COLUMN public.historical_prices.data_level IS 'Whether data is city-specific or district-level fallback';
COMMENT ON COLUMN public.cities.historical_data_notes IS 'JSON containing confidence_level, earliest_reliable_year, methodology notes';