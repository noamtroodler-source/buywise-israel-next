-- Add saved_locations column to buyer_profiles table
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS saved_locations JSONB DEFAULT '[]'::jsonb;

-- Add a comment for documentation
COMMENT ON COLUMN public.buyer_profiles.saved_locations IS 'Array of user-saved core locations (max 5) with label, address, coordinates, and icon';