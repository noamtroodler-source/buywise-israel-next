-- Add source tracking columns to historical_prices table
ALTER TABLE public.historical_prices 
ADD COLUMN IF NOT EXISTS source text,
ADD COLUMN IF NOT EXISTS data_level text DEFAULT 'city';

-- Add historical_data_notes to cities table for data quality documentation
ALTER TABLE public.cities 
ADD COLUMN IF NOT EXISTS historical_data_notes jsonb;