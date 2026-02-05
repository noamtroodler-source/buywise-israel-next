-- Create cache table for storing AI-generated questions per listing
CREATE TABLE public.listing_question_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,  -- 'property' or 'project'
  entity_id UUID NOT NULL,    -- property_id or project_id
  cache_key TEXT NOT NULL,    -- hash of listing data for cache invalidation
  questions JSONB NOT NULL,   -- the generated questions array
  source TEXT NOT NULL,       -- 'ai', 'fallback', etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  
  UNIQUE(entity_type, entity_id, cache_key)
);

-- Index for fast cache lookups
CREATE INDEX idx_listing_question_cache_lookup 
  ON public.listing_question_cache(entity_type, entity_id, cache_key);

-- Index for cleanup of expired entries
CREATE INDEX idx_listing_question_cache_expires 
  ON public.listing_question_cache(expires_at);

-- RLS: Allow edge functions (service role) to read/write
ALTER TABLE public.listing_question_cache ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (edge functions use service role key)
CREATE POLICY "Service role can manage cache"
  ON public.listing_question_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);