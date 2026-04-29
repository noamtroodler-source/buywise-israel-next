DROP INDEX IF EXISTS public.idx_properties_price_context_badge_status;
DROP INDEX IF EXISTS public.idx_properties_benchmark_review_status;
DROP INDEX IF EXISTS public.idx_properties_benchmark_review_requested_at;
DROP INDEX IF EXISTS public.idx_properties_price_context_filter_eligible;

ALTER TABLE public.properties
  DROP CONSTRAINT IF EXISTS properties_benchmark_review_resolution_check;

ALTER TABLE public.properties
  DROP COLUMN IF EXISTS benchmark_review_status,
  DROP COLUMN IF EXISTS benchmark_review_reason,
  DROP COLUMN IF EXISTS benchmark_review_notes,
  DROP COLUMN IF EXISTS benchmark_review_requested_at,
  DROP COLUMN IF EXISTS benchmark_review_resolved_at,
  DROP COLUMN IF EXISTS benchmark_review_admin_notes,
  DROP COLUMN IF EXISTS benchmark_review_resolution,
  DROP COLUMN IF EXISTS price_context_badge_status,
  DROP COLUMN IF EXISTS price_context_filter_eligible,
  DROP COLUMN IF EXISTS price_context_featured_eligible;