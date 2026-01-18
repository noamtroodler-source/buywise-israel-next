-- Add listing renewal tracking columns to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ DEFAULT now();

-- Add index for efficient queries on stale listings
CREATE INDEX IF NOT EXISTS idx_properties_last_renewed_at ON public.properties(last_renewed_at);

-- Update existing properties to have current timestamp as last_renewed_at
UPDATE public.properties 
SET last_renewed_at = COALESCE(updated_at, created_at, now())
WHERE last_renewed_at IS NULL;