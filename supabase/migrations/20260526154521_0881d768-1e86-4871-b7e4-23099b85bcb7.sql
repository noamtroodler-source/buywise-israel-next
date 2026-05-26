
-- 1. Article enrichment columns
ALTER TABLE public.intel_articles
  ADD COLUMN IF NOT EXISTS headline_en TEXT,
  ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
  ADD COLUMN IF NOT EXISTS translated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS auto_categorized BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS dedup_group_id UUID,
  ADD COLUMN IF NOT EXISTS is_duplicate BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_intel_articles_dedup_group ON public.intel_articles(dedup_group_id);
CREATE INDEX IF NOT EXISTS idx_intel_articles_dup_visible ON public.intel_articles(is_hidden, is_duplicate, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_intel_articles_translated_null ON public.intel_articles(translated_at) WHERE translated_at IS NULL AND source_language = 'he';

-- 2. AI-drafted flag on takes
ALTER TABLE public.intel_takes
  ADD COLUMN IF NOT EXISTS ai_drafted BOOLEAN NOT NULL DEFAULT false;

-- 3. Outbound click tracking
CREATE TABLE IF NOT EXISTS public.intel_article_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.intel_articles(id) ON DELETE CASCADE,
  user_id UUID,
  session_id TEXT,
  referrer_path TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intel_clicks_article ON public.intel_article_clicks(article_id);
CREATE INDEX IF NOT EXISTS idx_intel_clicks_created ON public.intel_article_clicks(created_at DESC);

GRANT SELECT, INSERT ON public.intel_article_clicks TO authenticated;
GRANT INSERT ON public.intel_article_clicks TO anon;
GRANT ALL ON public.intel_article_clicks TO service_role;

ALTER TABLE public.intel_article_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log clicks" ON public.intel_article_clicks;
CREATE POLICY "Anyone can log clicks"
  ON public.intel_article_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Admins read clicks" ON public.intel_article_clicks;
CREATE POLICY "Admins read clicks"
  ON public.intel_article_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. Recreate the public feed view with new fields, hiding duplicates by default.
DROP VIEW IF EXISTS public.intel_feed_v;
CREATE VIEW public.intel_feed_v
WITH (security_invoker = true)
AS
SELECT
  a.id,
  a.source_id,
  a.source_name,
  a.source_language,
  a.source_tier,
  a.headline,
  a.headline_en,
  a.excerpt,
  a.excerpt_en,
  a.translated_at,
  a.url,
  a.image_url,
  a.published_at,
  a.category,
  a.category_confidence,
  a.auto_categorized,
  a.relevance_score,
  a.is_featured,
  a.is_pinned,
  a.is_hidden,
  a.is_duplicate,
  a.dedup_group_id,
  a.created_at,
  t.id AS take_id,
  t.take_label,
  t.take_body,
  t.published_at AS take_published_at,
  t.ai_drafted AS take_ai_drafted
FROM public.intel_articles a
LEFT JOIN public.intel_takes t ON t.article_id = a.id;

GRANT SELECT ON public.intel_feed_v TO anon, authenticated;

-- 5. Source-health view for admin
DROP VIEW IF EXISTS public.intel_source_health_v;
CREATE VIEW public.intel_source_health_v
WITH (security_invoker = true)
AS
SELECT
  s.id,
  s.name,
  s.url,
  s.homepage_url,
  s.language,
  s.tier,
  s.enabled,
  s.last_fetched_at,
  s.last_error,
  EXTRACT(EPOCH FROM (now() - COALESCE(s.last_fetched_at, '1970-01-01'::timestamptz))) / 3600.0 AS hours_since_fetch,
  (SELECT COUNT(*) FROM public.intel_articles a
     WHERE a.source_id = s.id
       AND a.published_at > now() - INTERVAL '7 days') AS articles_last_7d,
  (s.enabled
    AND (s.last_fetched_at IS NULL
         OR s.last_fetched_at < now() - INTERVAL '48 hours'
         OR (s.last_error IS NOT NULL AND s.last_error <> ''))) AS is_unhealthy
FROM public.intel_sources s;

GRANT SELECT ON public.intel_source_health_v TO authenticated;
