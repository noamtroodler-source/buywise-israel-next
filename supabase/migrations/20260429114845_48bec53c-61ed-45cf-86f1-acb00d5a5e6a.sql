-- Phase 1: canonical source identity and import decision tracking

-- Helper: build a stable source identity key from either a native source item id
-- or a canonicalized URL. Native ids win because they survive URL shape changes.
CREATE OR REPLACE FUNCTION public.build_source_identity_key(
  p_source_type text,
  p_source_url text,
  p_source_item_id text DEFAULT NULL
)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_source_type text;
  v_source_item_id text;
  v_canonical_url text;
BEGIN
  v_source_type := lower(nullif(trim(coalesce(p_source_type, 'unknown')), ''));
  v_source_item_id := lower(nullif(trim(coalesce(p_source_item_id, '')), ''));

  IF v_source_item_id IS NOT NULL THEN
    RETURN v_source_type || ':id:' || v_source_item_id;
  END IF;

  v_canonical_url := public.normalize_url(p_source_url);
  IF v_canonical_url IS NOT NULL THEN
    RETURN v_source_type || ':url:' || lower(v_canonical_url);
  END IF;

  RETURN NULL;
END;
$$;

-- Existing public listings get first-class source identity fields.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS canonical_source_url text,
  ADD COLUMN IF NOT EXISTS source_item_id text,
  ADD COLUMN IF NOT EXISTS source_identity_key text,
  ADD COLUMN IF NOT EXISTS source_domain text,
  ADD COLUMN IF NOT EXISTS source_identity_reason text,
  ADD COLUMN IF NOT EXISTS source_identity_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Import queue rows record the exact source identity and duplicate/idempotency result.
ALTER TABLE public.import_job_items
  ADD COLUMN IF NOT EXISTS canonical_source_url text,
  ADD COLUMN IF NOT EXISTS source_item_id text,
  ADD COLUMN IF NOT EXISTS source_identity_key text,
  ADD COLUMN IF NOT EXISTS duplicate_decision text,
  ADD COLUMN IF NOT EXISTS duplicate_reason_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS matched_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicate_checked_at timestamptz;

-- One row per observed source item, connected to the public listing when known.
CREATE TABLE IF NOT EXISTS public.property_source_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  agency_id uuid REFERENCES public.agencies(id) ON DELETE CASCADE,
  import_job_id uuid REFERENCES public.import_jobs(id) ON DELETE SET NULL,
  import_job_item_id uuid REFERENCES public.import_job_items(id) ON DELETE SET NULL,
  source_type text NOT NULL,
  source_url text NOT NULL,
  canonical_source_url text,
  source_domain text,
  source_item_id text,
  source_identity_key text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  last_scraped_at timestamptz,
  observation_status text NOT NULL DEFAULT 'active',
  duplicate_decision text,
  duplicate_reason_codes text[] NOT NULL DEFAULT ARRAY[]::text[],
  matched_property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  confidence_score integer,
  raw_extracted_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.property_source_observations ENABLE ROW LEVEL SECURITY;

-- Keep updated_at current.
DROP TRIGGER IF EXISTS update_property_source_observations_updated_at ON public.property_source_observations;
CREATE TRIGGER update_property_source_observations_updated_at
BEFORE UPDATE ON public.property_source_observations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill existing properties where possible.
UPDATE public.properties
SET canonical_source_url = public.normalize_url(source_url),
    source_identity_key = public.build_source_identity_key(import_source, source_url, source_item_id),
    source_domain = CASE
      WHEN source_url IS NULL THEN NULL
      ELSE lower(regexp_replace(public.normalize_url(source_url), '^https?://([^/]+).*$','\1'))
    END,
    source_identity_reason = CASE WHEN source_url IS NOT NULL THEN 'backfilled_from_source_url' ELSE source_identity_reason END
WHERE source_url IS NOT NULL
  AND (canonical_source_url IS NULL OR source_identity_key IS NULL OR source_domain IS NULL);

-- Useful lookup indexes. Avoid unique constraints for now because legacy rows may already contain duplicates.
CREATE INDEX IF NOT EXISTS idx_properties_source_identity_key
  ON public.properties(source_identity_key)
  WHERE source_identity_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_canonical_source_url
  ON public.properties(canonical_source_url)
  WHERE canonical_source_url IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_job_items_source_identity_key
  ON public.import_job_items(source_identity_key)
  WHERE source_identity_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_import_job_items_duplicate_decision
  ON public.import_job_items(duplicate_decision, duplicate_checked_at DESC)
  WHERE duplicate_decision IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_source_observations_identity
  ON public.property_source_observations(source_identity_key)
  WHERE source_identity_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_property_source_observations_agency_seen
  ON public.property_source_observations(agency_id, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS idx_property_source_observations_property
  ON public.property_source_observations(property_id);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_property_source_observations_agency_identity
  ON public.property_source_observations(agency_id, source_identity_key)
  WHERE agency_id IS NOT NULL AND source_identity_key IS NOT NULL;

-- RLS policies for source observations.
DROP POLICY IF EXISTS "Admins can manage source observations" ON public.property_source_observations;
CREATE POLICY "Admins can manage source observations"
ON public.property_source_observations
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Agencies can view their source observations" ON public.property_source_observations;
CREATE POLICY "Agencies can view their source observations"
ON public.property_source_observations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agencies a
    WHERE a.id = property_source_observations.agency_id
      AND a.admin_user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.agents ag
    WHERE ag.agency_id = property_source_observations.agency_id
      AND ag.user_id = auth.uid()
  )
);
