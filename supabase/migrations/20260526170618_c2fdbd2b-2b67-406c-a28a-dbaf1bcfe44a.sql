
-- Enums
DO $$ BEGIN
  CREATE TYPE public.intel_take_tier AS ENUM ('breakdown', 'deep_read');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.intel_take_status AS ENUM ('draft', 'pending_review', 'published', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- New columns on intel_takes
ALTER TABLE public.intel_takes
  ADD COLUMN IF NOT EXISTS tier public.intel_take_tier NOT NULL DEFAULT 'breakdown',
  ADD COLUMN IF NOT EXISTS status public.intel_take_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS signal text,
  ADD COLUMN IF NOT EXISTS why_you_care text,
  ADD COLUMN IF NOT EXISTS our_move text,
  ADD COLUMN IF NOT EXISTS deep_read_body text,
  ADD COLUMN IF NOT EXISTS deep_read_subheads jsonb,
  ADD COLUMN IF NOT EXISTS rejected_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

-- Backfill: existing rows are breakdowns; if published_at is set treat as published
UPDATE public.intel_takes
SET tier = 'breakdown',
    status = CASE WHEN published_at IS NOT NULL THEN 'published'::public.intel_take_status
                  ELSE 'draft'::public.intel_take_status END
WHERE tier IS NULL OR status IS NULL;

-- Unique (article, tier)
DROP INDEX IF EXISTS intel_takes_article_tier_uniq;
CREATE UNIQUE INDEX intel_takes_article_tier_uniq
  ON public.intel_takes (article_id, tier);

CREATE INDEX IF NOT EXISTS idx_intel_takes_status_published
  ON public.intel_takes (status, published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_intel_takes_tier_status
  ON public.intel_takes (tier, status);

-- Replace validation trigger: breakdown ≤ 90 words across beats; deep_read 200–600 words
CREATE OR REPLACE FUNCTION public.validate_intel_take_length()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  total_words int;
  body_words int;
BEGIN
  IF NEW.tier = 'breakdown' THEN
    total_words := array_length(
      regexp_split_to_array(
        trim(coalesce(NEW.signal, '') || ' ' || coalesce(NEW.why_you_care, '') || ' ' || coalesce(NEW.our_move, '')),
        '\s+'
      ),
      1
    );
    IF total_words IS NOT NULL AND total_words > 110 THEN
      RAISE EXCEPTION 'Breakdown exceeds 110 words (got %)', total_words;
    END IF;
    -- keep take_body in sync as a single rendered string for legacy consumers
    IF NEW.signal IS NOT NULL OR NEW.why_you_care IS NOT NULL OR NEW.our_move IS NOT NULL THEN
      NEW.take_body := trim(
        concat_ws(E'\n\n',
          NULLIF(NEW.signal, ''),
          NULLIF(NEW.why_you_care, ''),
          NULLIF(NEW.our_move, '')
        )
      );
    END IF;
  ELSIF NEW.tier = 'deep_read' THEN
    body_words := array_length(regexp_split_to_array(trim(coalesce(NEW.deep_read_body, NEW.take_body, '')), '\s+'), 1);
    IF body_words IS NULL OR body_words < 150 THEN
      RAISE EXCEPTION 'Deep Read must be at least 150 words (got %)', coalesce(body_words, 0);
    END IF;
    IF body_words > 700 THEN
      RAISE EXCEPTION 'Deep Read exceeds 700 words (got %)', body_words;
    END IF;
  END IF;

  -- Stamp review fields
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;

  RETURN NEW;
END;
$$;

-- Update RLS: public reads only status='published'
DROP POLICY IF EXISTS "Public can read published takes" ON public.intel_takes;
CREATE POLICY "Public can read published takes"
  ON public.intel_takes
  FOR SELECT
  USING (status = 'published');
