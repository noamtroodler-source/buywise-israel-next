
-- Helper: slug from headline
CREATE OR REPLACE FUNCTION public.intel_slugify(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT
    trim(BOTH '-' FROM
      regexp_replace(
        regexp_replace(lower(coalesce(input, '')), '[^a-z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )
    )
$$;

-- Rebuild intel_feed_v — only breakdown takes, only published
DROP VIEW IF EXISTS public.intel_feed_v;
CREATE VIEW public.intel_feed_v AS
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
  t.signal,
  t.why_you_care,
  t.our_move,
  t.published_at AS take_published_at,
  t.ai_drafted AS take_ai_drafted,
  -- Deep Read summary (lightweight — full body fetched via deep_reads view)
  d.id IS NOT NULL AS has_deep_read,
  CASE WHEN d.id IS NOT NULL THEN public.intel_slugify(coalesce(a.headline_en, a.headline)) END AS deep_read_slug
FROM public.intel_articles a
LEFT JOIN public.intel_takes t
  ON t.article_id = a.id AND t.tier = 'breakdown' AND t.status = 'published'
LEFT JOIN public.intel_takes d
  ON d.article_id = a.id AND d.tier = 'deep_read' AND d.status = 'published';

GRANT SELECT ON public.intel_feed_v TO anon, authenticated;

-- Deep Reads view (published, public)
CREATE OR REPLACE VIEW public.intel_deep_reads_v AS
SELECT
  d.id AS take_id,
  d.article_id,
  a.headline,
  a.headline_en,
  a.url AS source_url,
  a.source_name,
  a.image_url,
  a.published_at AS article_published_at,
  a.category,
  d.published_at,
  d.signal,
  d.why_you_care,
  d.our_move,
  d.deep_read_body,
  d.deep_read_subheads,
  d.take_label,
  d.ai_drafted,
  public.intel_slugify(coalesce(a.headline_en, a.headline)) AS slug
FROM public.intel_takes d
JOIN public.intel_articles a ON a.id = d.article_id
WHERE d.tier = 'deep_read'
  AND d.status = 'published'
  AND a.is_hidden = false;

GRANT SELECT ON public.intel_deep_reads_v TO anon, authenticated;

-- Pending deep reads (admin queue) — underlying RLS on intel_takes restricts
CREATE OR REPLACE VIEW public.intel_pending_deep_reads_v AS
SELECT
  d.id AS take_id,
  d.article_id,
  a.headline,
  a.headline_en,
  a.excerpt_en,
  a.url AS source_url,
  a.source_name,
  a.image_url,
  a.published_at AS article_published_at,
  a.category,
  a.relevance_score,
  d.status,
  d.created_at,
  d.signal,
  d.why_you_care,
  d.our_move,
  d.deep_read_body,
  d.deep_read_subheads,
  d.take_label,
  d.ai_drafted
FROM public.intel_takes d
JOIN public.intel_articles a ON a.id = d.article_id
WHERE d.tier = 'deep_read'
  AND d.status IN ('pending_review', 'draft');

GRANT SELECT ON public.intel_pending_deep_reads_v TO authenticated;
