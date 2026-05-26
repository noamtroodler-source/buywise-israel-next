
ALTER TABLE public.intel_articles ADD COLUMN IF NOT EXISTS image_url text;

DROP VIEW IF EXISTS public.intel_feed_v;

CREATE VIEW public.intel_feed_v
WITH (security_invoker=on) AS
SELECT a.id, a.source_id, a.source_name, a.source_language, a.source_tier,
       a.headline, a.excerpt, a.url, a.image_url, a.published_at, a.category,
       a.relevance_score, a.is_featured, a.is_pinned, a.is_hidden, a.created_at,
       t.id AS take_id, t.take_label, t.take_body, t.published_at AS take_published_at
FROM intel_articles a
LEFT JOIN LATERAL (
  SELECT id, take_label, take_body, published_at
  FROM intel_takes
  WHERE article_id = a.id AND published_at IS NOT NULL
  ORDER BY published_at DESC
  LIMIT 1
) t ON true;

GRANT SELECT ON public.intel_feed_v TO anon, authenticated;
