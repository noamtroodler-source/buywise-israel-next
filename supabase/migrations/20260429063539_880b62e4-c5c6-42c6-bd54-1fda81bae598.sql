ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS benchmark_review_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS benchmark_review_resolved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS benchmark_review_admin_notes TEXT,
ADD COLUMN IF NOT EXISTS benchmark_review_resolution TEXT,
ADD COLUMN IF NOT EXISTS price_context_display_mode TEXT NOT NULL DEFAULT 'soft',
ADD COLUMN IF NOT EXISTS price_context_filter_eligible BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS price_context_placement_eligible BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS price_context_featured_eligible BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_benchmark_review_resolution_check;

ALTER TABLE public.properties
ADD CONSTRAINT properties_benchmark_review_resolution_check
CHECK (
  benchmark_review_resolution IS NULL OR benchmark_review_resolution IN (
    'accepted',
    'data_corrected',
    'confidence_softened',
    'more_data_needed'
  )
);

ALTER TABLE public.properties
DROP CONSTRAINT IF EXISTS properties_price_context_display_mode_check;

ALTER TABLE public.properties
ADD CONSTRAINT properties_price_context_display_mode_check
CHECK (price_context_display_mode IN ('soft', 'full', 'hidden'));

CREATE INDEX IF NOT EXISTS idx_properties_benchmark_review_requested_at
ON public.properties (benchmark_review_requested_at)
WHERE benchmark_review_requested_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_price_context_filter_eligible
ON public.properties (price_context_filter_eligible)
WHERE price_context_filter_eligible = true;

CREATE INDEX IF NOT EXISTS idx_properties_price_context_placement_eligible
ON public.properties (price_context_placement_eligible)
WHERE price_context_placement_eligible = true;

COMMENT ON COLUMN public.properties.benchmark_review_requested_at IS 'When a professional requested a Price Context benchmark review.';
COMMENT ON COLUMN public.properties.benchmark_review_resolved_at IS 'When an admin resolved a Price Context benchmark review.';
COMMENT ON COLUMN public.properties.benchmark_review_admin_notes IS 'Internal admin notes about benchmark review resolution.';
COMMENT ON COLUMN public.properties.benchmark_review_resolution IS 'Admin resolution outcome for a Price Context benchmark review.';
COMMENT ON COLUMN public.properties.price_context_display_mode IS 'Internal rollout control for buyer-facing Price Context display: soft, full, hidden.';
COMMENT ON COLUMN public.properties.price_context_filter_eligible IS 'Whether this listing can appear in a buyer filter for complete Price Context.';
COMMENT ON COLUMN public.properties.price_context_placement_eligible IS 'Whether this listing can qualify for stronger marketplace placement based on Price Context.';
COMMENT ON COLUMN public.properties.price_context_featured_eligible IS 'Whether this listing can qualify for future featured placement requirements based on Price Context.';