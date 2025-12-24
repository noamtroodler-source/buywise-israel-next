-- 1) Report versions (which PDF set is canonical right now)
CREATE TABLE IF NOT EXISTS public.report_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_key text NOT NULL UNIQUE,
  title text,
  source_notes text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure only one active report version at a time
CREATE UNIQUE INDEX IF NOT EXISTS report_versions_single_active
  ON public.report_versions ((is_active))
  WHERE is_active = true;

ALTER TABLE public.report_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Report versions are viewable by everyone"
ON public.report_versions
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage report versions"
ON public.report_versions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Canonical city metrics for a specific report version
CREATE TABLE IF NOT EXISTS public.city_canonical_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug text NOT NULL,
  report_version_key text NOT NULL,

  -- core snapshot metrics
  average_price_sqm numeric,
  median_apartment_price numeric,
  yoy_price_change numeric,
  gross_yield_percent numeric,
  net_yield_percent numeric,
  arnona_rate_sqm numeric,
  arnona_monthly_avg numeric,

  -- rental snapshot (rooms 2-5)
  rental_2_room_min numeric,
  rental_2_room_max numeric,
  rental_3_room_min numeric,
  rental_3_room_max numeric,
  rental_4_room_min numeric,
  rental_4_room_max numeric,
  rental_5_room_min numeric,
  rental_5_room_max numeric,

  -- optional provenance
  source_priority text, -- e.g. 'city_sheet' | 'comprehensive_report'
  source_page_ref text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT city_canonical_metrics_city_slug_fk
    FOREIGN KEY (city_slug) REFERENCES public.cities(slug) ON DELETE CASCADE,

  CONSTRAINT city_canonical_metrics_report_version_fk
    FOREIGN KEY (report_version_key) REFERENCES public.report_versions(version_key) ON DELETE CASCADE,

  CONSTRAINT city_canonical_metrics_unique_city_version UNIQUE (city_slug, report_version_key)
);

CREATE INDEX IF NOT EXISTS city_canonical_metrics_city_slug_idx
  ON public.city_canonical_metrics (city_slug);

CREATE INDEX IF NOT EXISTS city_canonical_metrics_report_version_idx
  ON public.city_canonical_metrics (report_version_key);

ALTER TABLE public.city_canonical_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Canonical city metrics are viewable by everyone"
ON public.city_canonical_metrics
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage canonical city metrics"
ON public.city_canonical_metrics
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) updated_at trigger
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_city_canonical_metrics_updated_at'
  ) THEN
    CREATE TRIGGER update_city_canonical_metrics_updated_at
    BEFORE UPDATE ON public.city_canonical_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) Seed an active report version placeholder (safe if already exists)
INSERT INTO public.report_versions (version_key, title, source_notes, is_active)
VALUES (
  '2025-12-24-report-12',
  'Israeli Real Estate Platform – Comprehensive Research Report (v12) + Ashdod (v13)',
  'Canonical snapshot based on the latest uploaded PDFs. Replace version_key/title as needed.',
  true
)
ON CONFLICT (version_key) DO UPDATE
SET title = EXCLUDED.title,
    source_notes = EXCLUDED.source_notes;

-- If there was an older active version, deactivate it (keep the one above active)
UPDATE public.report_versions
SET is_active = false
WHERE version_key <> '2025-12-24-report-12'
  AND is_active = true;
