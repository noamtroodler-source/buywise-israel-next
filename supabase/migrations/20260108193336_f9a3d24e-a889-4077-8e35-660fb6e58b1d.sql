-- Add new columns to buyer_profiles for multi-dimensional buyer characteristics
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS has_existing_property boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_upgrading boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS upgrade_sale_date date;

-- Add a comment for documentation
COMMENT ON COLUMN public.buyer_profiles.has_existing_property IS 'Whether the buyer already owns property in Israel (separate from is_first_property for nuanced cases)';
COMMENT ON COLUMN public.buyer_profiles.is_upgrading IS 'Whether the buyer is selling their existing property within 18 months to qualify for first-time rates';
COMMENT ON COLUMN public.buyer_profiles.upgrade_sale_date IS 'Date the buyer plans to or did sell their existing property (for upgrade deadline tracking)';