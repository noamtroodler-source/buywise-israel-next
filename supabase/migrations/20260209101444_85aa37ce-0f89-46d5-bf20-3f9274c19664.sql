-- Add preference columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preferred_area_unit text DEFAULT NULL;