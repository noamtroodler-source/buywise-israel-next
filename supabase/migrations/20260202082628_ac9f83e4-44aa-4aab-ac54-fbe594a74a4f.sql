-- Add social link columns to agents table
ALTER TABLE public.agents 
ADD COLUMN linkedin_url text,
ADD COLUMN instagram_url text,
ADD COLUMN facebook_url text;