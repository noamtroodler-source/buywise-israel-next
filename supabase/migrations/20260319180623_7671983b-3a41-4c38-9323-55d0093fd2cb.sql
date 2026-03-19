
ALTER TABLE public.map_pois
  ADD COLUMN IF NOT EXISTS denomination TEXT,
  ADD COLUMN IF NOT EXISTS english_level TEXT,
  ADD COLUMN IF NOT EXISTS geocode_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS source_url TEXT;

ALTER TABLE public.map_pois
  ALTER COLUMN latitude DROP NOT NULL,
  ALTER COLUMN longitude DROP NOT NULL;
