-- Update check constraint to allow 'national' data level
ALTER TABLE public.historical_prices DROP CONSTRAINT IF EXISTS historical_prices_data_level_check;
ALTER TABLE public.historical_prices ADD CONSTRAINT historical_prices_data_level_check 
CHECK (data_level = ANY (ARRAY['city'::text, 'district'::text, 'national'::text]));