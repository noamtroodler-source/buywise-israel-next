-- Backfill default_invite_code for any agency missing one
-- Generates a 6-char uppercase alphanumeric code from the agency slug
UPDATE public.agencies
SET default_invite_code = UPPER(SUBSTRING(md5(slug || id::text) FROM 1 FOR 6))
WHERE default_invite_code IS NULL;