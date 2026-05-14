ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_demo_fabricated boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_properties_is_demo_fabricated
  ON public.properties (is_demo_fabricated)
  WHERE is_demo_fabricated = true;

COMMENT ON COLUMN public.properties.is_demo_fabricated IS
  'Admin-only flag: row contains synthesized/fabricated fields used for demo/preview. Exclude from analytics, comps, price-per-sqm, and trust-signal calculations. Never surface in UI.';