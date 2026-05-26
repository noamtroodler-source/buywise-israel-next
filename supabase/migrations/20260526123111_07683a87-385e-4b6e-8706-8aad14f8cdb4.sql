
-- =========================================
-- BuyWise Intel — Phase 1 schema
-- =========================================

-- 1) Sources
CREATE TABLE public.intel_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL UNIQUE,
  homepage_url text,
  language text NOT NULL DEFAULT 'en' CHECK (language IN ('en','he')),
  tier smallint NOT NULL DEFAULT 1 CHECK (tier IN (1,2)),
  enabled boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Articles
CREATE TABLE public.intel_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.intel_sources(id) ON DELETE SET NULL,
  source_name text NOT NULL,
  source_language text NOT NULL DEFAULT 'en',
  source_tier smallint NOT NULL DEFAULT 1,
  headline text NOT NULL,
  excerpt text,
  url text NOT NULL UNIQUE,
  published_at timestamptz NOT NULL,
  category text NOT NULL DEFAULT 'general',
  relevance_score smallint NOT NULL DEFAULT 3,
  is_featured boolean NOT NULL DEFAULT false,
  is_pinned boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_articles_published_at ON public.intel_articles (published_at DESC);
CREATE INDEX idx_intel_articles_category ON public.intel_articles (category);
CREATE INDEX idx_intel_articles_relevance ON public.intel_articles (relevance_score DESC);
CREATE INDEX idx_intel_articles_visible ON public.intel_articles (is_hidden, published_at DESC);

-- 3) Takes
CREATE TABLE public.intel_takes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL REFERENCES public.intel_articles(id) ON DELETE CASCADE,
  take_label text NOT NULL DEFAULT 'BuyWise Take',
  take_body text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_intel_takes_article ON public.intel_takes (article_id);
CREATE INDEX idx_intel_takes_published ON public.intel_takes (published_at DESC NULLS LAST);

-- 4) Fetch log
CREATE TABLE public.intel_fetch_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid REFERENCES public.intel_sources(id) ON DELETE SET NULL,
  source_name text,
  ran_at timestamptz NOT NULL DEFAULT now(),
  articles_added int NOT NULL DEFAULT 0,
  error text
);

CREATE INDEX idx_intel_fetch_log_ran_at ON public.intel_fetch_log (ran_at DESC);

-- 5) Brief subscribers
CREATE TABLE public.intel_brief_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =========================================
-- updated_at triggers (reuse public.update_updated_at_column if present)
-- =========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace) THEN
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public
    AS $f$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $f$;
  END IF;
END $$;

CREATE TRIGGER trg_intel_sources_updated_at
  BEFORE UPDATE ON public.intel_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_intel_articles_updated_at
  BEFORE UPDATE ON public.intel_articles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_intel_takes_updated_at
  BEFORE UPDATE ON public.intel_takes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- Word-count validation trigger for takes (≤300)
-- =========================================
CREATE OR REPLACE FUNCTION public.validate_intel_take_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  word_count int;
BEGIN
  IF NEW.take_body IS NULL OR length(trim(NEW.take_body)) = 0 THEN
    RAISE EXCEPTION 'Take body cannot be empty';
  END IF;
  word_count := array_length(regexp_split_to_array(trim(NEW.take_body), '\s+'), 1);
  IF word_count > 300 THEN
    RAISE EXCEPTION 'Take body exceeds 300 words (got %)', word_count;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_intel_takes_validate_length
  BEFORE INSERT OR UPDATE ON public.intel_takes
  FOR EACH ROW EXECUTE FUNCTION public.validate_intel_take_length();

-- =========================================
-- Feed view: articles + latest published take
-- =========================================
CREATE OR REPLACE VIEW public.intel_feed_v AS
SELECT
  a.id,
  a.source_id,
  a.source_name,
  a.source_language,
  a.source_tier,
  a.headline,
  a.excerpt,
  a.url,
  a.published_at,
  a.category,
  a.relevance_score,
  a.is_featured,
  a.is_pinned,
  a.is_hidden,
  a.created_at,
  t.id AS take_id,
  t.take_label,
  t.take_body,
  t.published_at AS take_published_at
FROM public.intel_articles a
LEFT JOIN LATERAL (
  SELECT id, take_label, take_body, published_at
  FROM public.intel_takes
  WHERE article_id = a.id AND published_at IS NOT NULL
  ORDER BY published_at DESC
  LIMIT 1
) t ON true;

-- =========================================
-- RLS
-- =========================================
ALTER TABLE public.intel_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_takes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_fetch_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intel_brief_subscribers ENABLE ROW LEVEL SECURITY;

-- Articles: public read non-hidden; admin full
CREATE POLICY "Public can read visible articles"
  ON public.intel_articles FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "Admins manage articles"
  ON public.intel_articles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Takes: public read published; admin full
CREATE POLICY "Public can read published takes"
  ON public.intel_takes FOR SELECT
  USING (published_at IS NOT NULL);

CREATE POLICY "Admins manage takes"
  ON public.intel_takes FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sources: admin only
CREATE POLICY "Admins manage sources"
  ON public.intel_sources FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fetch log: admin only
CREATE POLICY "Admins read fetch log"
  ON public.intel_fetch_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Subscribers: public insert, admin read
CREATE POLICY "Anyone can subscribe"
  ON public.intel_brief_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins read subscribers"
  ON public.intel_brief_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update subscribers"
  ON public.intel_brief_subscribers FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- =========================================
-- Seed sources (12 starter feeds — tier 1 = English-first / Israel-focused)
-- =========================================
INSERT INTO public.intel_sources (name, url, homepage_url, language, tier) VALUES
  ('The Times of Israel — Real Estate', 'https://www.timesofisrael.com/topic/real-estate/feed/', 'https://www.timesofisrael.com/', 'en', 1),
  ('The Times of Israel — Business', 'https://www.timesofisrael.com/topic/business/feed/', 'https://www.timesofisrael.com/', 'en', 1),
  ('The Jerusalem Post — Business & Innovation', 'https://www.jpost.com/rss/rssfeedsbusiness.aspx', 'https://www.jpost.com/', 'en', 1),
  ('Haaretz English — Business', 'https://www.haaretz.com/cmlink/1.628821', 'https://www.haaretz.com/', 'en', 1),
  ('Globes English', 'https://www.globes.co.il/WebServiceE/RssFeed.asmx/Feed?iID=1725', 'https://en.globes.co.il/', 'en', 1),
  ('CTech by Calcalist', 'https://www.calcalistech.com/ctech/Rss/0,16527,L-5099-13,00.xml', 'https://www.calcalistech.com/', 'en', 1),
  ('Bank of Israel — Press Releases', 'https://www.boi.org.il/he/NewsAndPublications/PressReleases/_layouts/15/listfeed.aspx?List=%7BC8F61B7C-D5DE-44C8-AC81-0DBE2DEB5DCA%7D', 'https://www.boi.org.il/en', 'en', 1),
  ('Israel Tax Authority — News', 'https://www.gov.il/en/Departments/news/israel_tax_authority', 'https://www.gov.il/en/departments/israel_tax_authority/govil-landing-page', 'en', 1),
  ('Calcalist (Hebrew) — Real Estate', 'https://www.calcalist.co.il/GeneralRss/0,16335,L-3674,00.xml', 'https://www.calcalist.co.il/', 'he', 2),
  ('Globes (Hebrew) — Real Estate', 'https://www.globes.co.il/WebService/Rss/RssFeeder.asmx/FeederNode?iID=605', 'https://www.globes.co.il/', 'he', 2),
  ('Ynet (Hebrew) — Real Estate', 'https://www.ynet.co.il/Integration/StoryRss550.xml', 'https://www.ynet.co.il/', 'he', 2),
  ('TheMarker (Hebrew) — Real Estate', 'https://www.themarker.com/cmlink/1.144', 'https://www.themarker.com/', 'he', 2);
