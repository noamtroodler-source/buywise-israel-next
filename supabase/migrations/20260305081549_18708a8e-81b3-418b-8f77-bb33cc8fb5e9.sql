
-- Saved listing analyses for logged-in users
CREATE TABLE public.saved_listing_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL,
  decoded_result JSONB NOT NULL,
  detected_city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_listing_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analyses"
  ON public.saved_listing_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON public.saved_listing_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON public.saved_listing_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Usage tracking for rate limiting (accessed via service role in edge function)
CREATE TABLE public.listing_decoder_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  used_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_decoder_usage ENABLE ROW LEVEL SECURITY;

-- No client-side RLS policies - accessed only via service role in edge function

CREATE INDEX idx_listing_decoder_usage_session_day 
  ON public.listing_decoder_usage (session_id, used_at);

CREATE INDEX idx_listing_decoder_usage_user_day 
  ON public.listing_decoder_usage (user_id, used_at);
