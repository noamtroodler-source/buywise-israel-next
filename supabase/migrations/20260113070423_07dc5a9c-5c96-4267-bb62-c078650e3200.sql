-- Add arnona discount categories to buyer_profiles
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS arnona_discount_categories TEXT[] DEFAULT '{}';