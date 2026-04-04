-- ============================================================
-- BuyWiseIsrael: Agency Scraping System
-- Adds agency_sources table, enriches properties with scraping
-- metadata, and sets up the infrastructure for automated
-- multi-source scraping from target agencies.
-- ============================================================

-- 1. Agency sources table — maps each agency to its scrape targets
CREATE TABLE IF NOT EXISTS public.agency_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Source info
  source_type TEXT NOT NULL CHECK (source_type IN ('yad2', 'madlan', 'website')),
  source_url TEXT NOT NULL,
  
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 3),
  -- 1 = primary, 2 = secondary, 3 = supplementary
  
  -- Sync state
  last_synced_at TIMESTAMPTZ DEFAULT NULL,
  last_sync_job_id UUID REFERENCES public.import_jobs(id) ON DELETE SET NULL,
  last_sync_listings_found INTEGER DEFAULT 0,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  last_failure_reason TEXT DEFAULT NULL,
  
  -- Metadata
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(agency_id, source_type, source_url)
);

ALTER TABLE public.agency_sources ENABLE ROW LEVEL SECURITY;

-- Only admins can manage agency sources
CREATE POLICY "Admins can manage agency_sources"
  ON public.agency_sources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Public read for active sources (needed for sync functions)
CREATE POLICY "Service role full access to agency_sources"
  ON public.agency_sources
  FOR ALL
  TO service_role
  USING (true);

-- 2. Add missing columns to properties table for scraped listings
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT NULL CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
  ADD COLUMN IF NOT EXISTS location_confidence TEXT DEFAULT NULL CHECK (location_confidence IN ('exact', 'neighborhood', 'city', 'unknown')),
  ADD COLUMN IF NOT EXISTS is_claimed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS claimed_by_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS source_agency_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_agent_name TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_agent_phone TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_last_checked_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS source_status TEXT DEFAULT 'active' CHECK (source_status IN ('active', 'removed', 'stale', 'price_changed')),
  ADD COLUMN IF NOT EXISTS street_view_url TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ai_english_description TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_vs_avg_pct NUMERIC DEFAULT NULL,
  -- cross-source dedup
  ADD COLUMN IF NOT EXISTS merged_source_urls TEXT[] DEFAULT NULL;

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_is_claimed ON public.properties(is_claimed) WHERE is_claimed = false;
CREATE INDEX IF NOT EXISTS idx_properties_data_quality ON public.properties(data_quality_score);
CREATE INDEX IF NOT EXISTS idx_properties_source_status ON public.properties(source_status);
CREATE INDEX IF NOT EXISTS idx_properties_claimed_agency ON public.properties(claimed_by_agency_id) WHERE claimed_by_agency_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_agency_sources_active ON public.agency_sources(is_active, source_type) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_agency_sources_agency ON public.agency_sources(agency_id);

-- 4. Claim requests table — for agents to claim scraped listings
CREATE TABLE IF NOT EXISTS public.listing_claim_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Claimant info (for non-onboarded agents)
  claimant_name TEXT,
  claimant_email TEXT NOT NULL,
  claimant_phone TEXT,
  agency_name TEXT,
  
  -- Verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ DEFAULT NULL,
  review_notes TEXT DEFAULT NULL,
  
  -- Evidence the claimant is the actual agent
  verification_note TEXT DEFAULT NULL,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_claim_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit claim requests"
  ON public.listing_claim_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage claim requests"
  ON public.listing_claim_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Service role full access to claim requests"
  ON public.listing_claim_requests
  FOR ALL
  TO service_role
  USING (true);

-- 5. Updated_at trigger for agency_sources
CREATE OR REPLACE FUNCTION update_agency_sources_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agency_sources_updated_at
  BEFORE UPDATE ON public.agency_sources
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_sources_updated_at();

-- 6. Updated_at trigger for listing_claim_requests
CREATE TRIGGER listing_claim_requests_updated_at
  BEFORE UPDATE ON public.listing_claim_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_agency_sources_updated_at();

-- 7. Function to mark a listing as claimed
CREATE OR REPLACE FUNCTION public.claim_listing(
  p_property_id UUID,
  p_agency_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.properties
  SET
    is_claimed = true,
    claimed_at = now(),
    claimed_by_agency_id = p_agency_id,
    is_published = true,
    verification_status = 'verified',
    updated_at = now()
  WHERE id = p_property_id
    AND (is_claimed = false OR claimed_by_agency_id = p_agency_id);
  
  RETURN FOUND;
END;
$$;
