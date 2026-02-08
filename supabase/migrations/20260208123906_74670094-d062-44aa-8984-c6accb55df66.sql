-- Add featured_highlight column to properties table
ALTER TABLE public.properties 
ADD COLUMN featured_highlight TEXT DEFAULT NULL;