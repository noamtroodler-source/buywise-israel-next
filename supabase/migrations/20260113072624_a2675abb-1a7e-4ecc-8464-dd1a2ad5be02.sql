-- Add TAMA 38 tracking columns to cities table
ALTER TABLE cities 
ADD COLUMN IF NOT EXISTS tama38_status TEXT DEFAULT 'expired',
ADD COLUMN IF NOT EXISTS tama38_expiry_date DATE,
ADD COLUMN IF NOT EXISTS tama38_notes TEXT;

COMMENT ON COLUMN cities.tama38_status IS 'TAMA 38 urban renewal status: active, expired, or extended';
COMMENT ON COLUMN cities.tama38_expiry_date IS 'If active/extended, expiration date of TAMA 38 eligibility';
COMMENT ON COLUMN cities.tama38_notes IS 'Additional notes about TAMA 38 status in this city';