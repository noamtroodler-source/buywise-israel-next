ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS price_context_property_class TEXT,
ADD COLUMN IF NOT EXISTS price_context_confidence_score INTEGER,
ADD COLUMN IF NOT EXISTS price_context_confidence_tier TEXT,
ADD COLUMN IF NOT EXISTS price_context_public_label TEXT,
ADD COLUMN IF NOT EXISTS price_context_percentage_suppressed BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS price_context_badge_status TEXT NOT NULL DEFAULT 'incomplete',
ADD COLUMN IF NOT EXISTS comp_pool_used TEXT,
ADD COLUMN IF NOT EXISTS sqm_source TEXT,
ADD COLUMN IF NOT EXISTS ownership_type TEXT,
ADD COLUMN IF NOT EXISTS benchmark_review_status TEXT NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS benchmark_review_reason TEXT,
ADD COLUMN IF NOT EXISTS benchmark_review_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_properties_price_context_confidence_tier
ON public.properties (price_context_confidence_tier);

CREATE INDEX IF NOT EXISTS idx_properties_price_context_badge_status
ON public.properties (price_context_badge_status);

CREATE INDEX IF NOT EXISTS idx_properties_benchmark_review_status
ON public.properties (benchmark_review_status);

CREATE TABLE IF NOT EXISTS public.price_context_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID,
  raw_gap_percent NUMERIC,
  public_label TEXT,
  percentage_suppressed BOOLEAN,
  confidence_tier TEXT,
  comp_pool_snapshot JSONB,
  premium_context_snapshot JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.price_context_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can read price context events" ON public.price_context_events;
CREATE POLICY "Admins can read price context events"
ON public.price_context_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can insert price context events" ON public.price_context_events;
CREATE POLICY "Admins can insert price context events"
ON public.price_context_events
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Listing agents can insert price context events" ON public.price_context_events;
CREATE POLICY "Listing agents can insert price context events"
ON public.price_context_events
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.properties p
    JOIN public.agents a ON a.id = p.agent_id
    WHERE p.id = price_context_events.property_id
      AND a.user_id = auth.uid()
  )
);

COMMENT ON COLUMN public.properties.sqm_source IS 'Source/basis for listed square meters: tabu, arnona, contractor_plan, marketing_gross, net_internal, agent_estimate, unknown.';
COMMENT ON COLUMN public.properties.ownership_type IS 'Ownership comparability context: private_tabu, minhal_leasehold, company_or_other, unknown.';
COMMENT ON COLUMN public.properties.benchmark_review_status IS 'Price Context benchmark review state: none, requested, under_review, resolved.';
COMMENT ON TABLE public.price_context_events IS 'Immutable event history for Price Context calculation, public display, agency context, and admin review workflow.';