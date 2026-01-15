-- Add district column to market_data if not exists
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS district TEXT;

-- Delete existing synthetic monthly data (to be replaced with quarterly)
DELETE FROM market_data WHERE data_type = 'monthly';

-- Update data_type comments: month field will now store quarter (1-4) for quarterly data
COMMENT ON COLUMN market_data.month IS 'For quarterly data: stores quarter number (1-4). For monthly data: stores month number (1-12).';

-- Create district mapping reference (for documentation)
COMMENT ON COLUMN market_data.district IS 'CBS district grouping: Tel Aviv District, Central District, Haifa District, Jerusalem District, Southern District';