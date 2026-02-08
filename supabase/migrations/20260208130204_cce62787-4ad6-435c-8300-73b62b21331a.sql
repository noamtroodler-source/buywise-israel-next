-- Add featured_highlight column to projects table
ALTER TABLE public.projects 
ADD COLUMN featured_highlight TEXT DEFAULT NULL;