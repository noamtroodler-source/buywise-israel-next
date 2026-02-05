-- Add furniture_items column to properties table
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS furniture_items text[] DEFAULT NULL;