-- Add source_url column to track where imported listings came from
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS source_url text;

-- Index for fast duplicate lookups during import
CREATE INDEX IF NOT EXISTS idx_properties_source_url ON public.properties (source_url) WHERE source_url IS NOT NULL;