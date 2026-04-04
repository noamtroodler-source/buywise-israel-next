-- ============================================================
-- BuyWiseIsrael: Co-listing agent tracking
-- When the same property is listed by multiple agencies
-- (common in Israel — no exclusivity), track all agents.
-- ============================================================

-- Table to track multiple agents/agencies per property
CREATE TABLE IF NOT EXISTS public.property_co_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  source_url TEXT NOT NULL, -- The specific URL this agent's listing came from
  source_type TEXT NOT NULL DEFAULT 'website' CHECK (source_type IN ('yad2', 'madlan', 'website')),
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(property_id, source_url)
);

ALTER TABLE public.property_co_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read for property_co_agents"
  ON public.property_co_agents FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Service role full access to property_co_agents"
  ON public.property_co_agents FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_property_co_agents_property ON public.property_co_agents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_co_agents_agent ON public.property_co_agents(agent_id);

-- Add co_listing_count to properties for quick display
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS co_listing_count INTEGER NOT NULL DEFAULT 0;

-- Function to increment co_listing_count
CREATE OR REPLACE FUNCTION increment_co_listing_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.properties
  SET co_listing_count = co_listing_count + 1
  WHERE id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER property_co_agents_count
  AFTER INSERT ON public.property_co_agents
  FOR EACH ROW
  EXECUTE FUNCTION increment_co_listing_count();
