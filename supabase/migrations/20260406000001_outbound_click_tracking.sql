-- ============================================================
-- BuyWiseIsrael: Outbound Click Tracking
-- Tracks when users click "View on Yad2 / Madlan" links from
-- scraped listings. Used for legal source attribution and
-- product analytics (how often users leave vs. contact in-app).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.outbound_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which property the user was viewing
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,

  -- Source platform ('yad2', 'madlan', 'website')
  source TEXT NOT NULL,

  -- The actual URL the user was sent to
  source_url TEXT NOT NULL,

  -- Optional: logged-in user
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Session ID (from existing analytics session logic)
  session_id TEXT DEFAULT NULL,

  -- Where on the site the click happened
  page TEXT NOT NULL DEFAULT 'detail' CHECK (page IN ('card', 'detail')),

  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outbound_clicks ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can log a click
CREATE POLICY "Anyone can log outbound clicks"
  ON public.outbound_clicks
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins can read all clicks for analytics
CREATE POLICY "Admins can read outbound clicks"
  ON public.outbound_clicks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role full access
CREATE POLICY "Service role full access to outbound_clicks"
  ON public.outbound_clicks
  FOR ALL
  TO service_role
  USING (true);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_property ON public.outbound_clicks(property_id);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_source ON public.outbound_clicks(source);
CREATE INDEX IF NOT EXISTS idx_outbound_clicks_clicked_at ON public.outbound_clicks(clicked_at DESC);
