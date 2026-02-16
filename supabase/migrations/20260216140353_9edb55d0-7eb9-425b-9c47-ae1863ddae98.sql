
-- Cache table for AI-generated market insights
CREATE TABLE public.market_insight_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid NOT NULL UNIQUE,
  insight_text text NOT NULL,
  input_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for lookups
CREATE INDEX idx_market_insight_cache_property_id ON public.market_insight_cache (property_id);

-- Enable RLS
ALTER TABLE public.market_insight_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (anon can SELECT cached insights)
CREATE POLICY "Anyone can read cached market insights"
  ON public.market_insight_cache
  FOR SELECT
  USING (true);

-- No client-side writes; edge function uses service role
