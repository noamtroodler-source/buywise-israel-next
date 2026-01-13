-- Phase 1: Add new columns to cities table for ranges and metadata
ALTER TABLE cities ADD COLUMN IF NOT EXISTS identity_sentence TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS card_description TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS region TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS arnona_discounts TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS commute_time_jerusalem INTEGER;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS data_sources JSONB;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS average_price_sqm_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS average_price_sqm_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS arnona_rate_sqm_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS arnona_rate_sqm_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS gross_yield_percent_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS gross_yield_percent_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS net_yield_percent_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS net_yield_percent_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS renovation_cost_basic_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS renovation_cost_basic_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS renovation_cost_premium_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS renovation_cost_premium_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS average_vaad_bayit_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS average_vaad_bayit_max NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE cities ADD COLUMN IF NOT EXISTS rental_5_room_min NUMERIC;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS rental_5_room_max NUMERIC;

-- Phase 2: Create city_market_factors table for "Worth Watching" data
CREATE TABLE IF NOT EXISTS city_market_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  timing TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint
ALTER TABLE city_market_factors 
ADD CONSTRAINT city_market_factors_city_slug_fkey 
FOREIGN KEY (city_slug) REFERENCES cities(slug) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_city_market_factors_city_slug ON city_market_factors(city_slug);

-- Enable RLS on city_market_factors
ALTER TABLE city_market_factors ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "City market factors are viewable by everyone"
ON city_market_factors FOR SELECT
USING (true);

-- Admin write access
CREATE POLICY "Admins can manage city market factors"
ON city_market_factors FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 3: Add source tracking to city_canonical_metrics
ALTER TABLE city_canonical_metrics ADD COLUMN IF NOT EXISTS data_sources JSONB;
ALTER TABLE city_canonical_metrics ADD COLUMN IF NOT EXISTS last_verified DATE;