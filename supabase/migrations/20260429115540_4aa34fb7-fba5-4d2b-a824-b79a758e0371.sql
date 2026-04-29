-- Phase 2: durable source observation layer

-- Normalize old import_source values into the same source_type vocabulary used by imports.
CREATE OR REPLACE FUNCTION public.normalize_listing_source_type(p_source_type text, p_source_url text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v text;
  u text;
BEGIN
  v := lower(nullif(trim(coalesce(p_source_type, '')), ''));
  u := lower(coalesce(p_source_url, ''));

  IF v IN ('website_scrape', 'website', 'agency_website') THEN
    RETURN 'website';
  ELSIF v IN ('yad2', 'madlan') THEN
    RETURN v;
  ELSIF u LIKE '%yad2.co.il%' THEN
    RETURN 'yad2';
  ELSIF u LIKE '%madlan.co.il%' THEN
    RETURN 'madlan';
  ELSE
    RETURN 'website';
  END IF;
END;
$$;

-- Make the observation uniqueness rule robust for both agency-scoped and agencyless rows.
DROP INDEX IF EXISTS uniq_property_source_observations_agency_identity;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_property_source_observations_agency_identity
  ON public.property_source_observations(agency_id, source_identity_key)
  WHERE agency_id IS NOT NULL AND source_identity_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_property_source_observations_global_identity
  ON public.property_source_observations(source_identity_key)
  WHERE agency_id IS NULL AND source_identity_key IS NOT NULL;

-- Helper used by database triggers and future backend paths.
CREATE OR REPLACE FUNCTION public.record_property_source_observation(
  p_property_id uuid,
  p_agency_id uuid,
  p_import_job_id uuid,
  p_import_job_item_id uuid,
  p_source_type text,
  p_source_url text,
  p_source_item_id text DEFAULT NULL,
  p_duplicate_decision text DEFAULT NULL,
  p_duplicate_reason_codes text[] DEFAULT ARRAY[]::text[],
  p_matched_property_id uuid DEFAULT NULL,
  p_confidence_score integer DEFAULT NULL,
  p_raw_extracted_data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_type text;
  v_canonical_url text;
  v_source_identity_key text;
  v_source_domain text;
  v_observation_id uuid;
BEGIN
  IF p_source_url IS NULL OR length(trim(p_source_url)) = 0 THEN
    RETURN NULL;
  END IF;

  v_source_type := public.normalize_listing_source_type(p_source_type, p_source_url);
  v_canonical_url := public.normalize_url(p_source_url);
  v_source_identity_key := public.build_source_identity_key(v_source_type, p_source_url, p_source_item_id);

  IF v_source_identity_key IS NULL THEN
    RETURN NULL;
  END IF;

  v_source_domain := CASE
    WHEN v_canonical_url IS NULL THEN NULL
    ELSE lower(regexp_replace(v_canonical_url, '^https?://([^/]+).*$','\1'))
  END;

  IF p_agency_id IS NOT NULL THEN
    SELECT id INTO v_observation_id
    FROM public.property_source_observations
    WHERE agency_id = p_agency_id
      AND source_identity_key = v_source_identity_key
    LIMIT 1;
  ELSE
    SELECT id INTO v_observation_id
    FROM public.property_source_observations
    WHERE agency_id IS NULL
      AND source_identity_key = v_source_identity_key
    LIMIT 1;
  END IF;

  IF v_observation_id IS NULL THEN
    INSERT INTO public.property_source_observations (
      property_id,
      agency_id,
      import_job_id,
      import_job_item_id,
      source_type,
      source_url,
      canonical_source_url,
      source_domain,
      source_item_id,
      source_identity_key,
      last_seen_at,
      last_scraped_at,
      observation_status,
      duplicate_decision,
      duplicate_reason_codes,
      matched_property_id,
      confidence_score,
      raw_extracted_data
    ) VALUES (
      p_property_id,
      p_agency_id,
      p_import_job_id,
      p_import_job_item_id,
      v_source_type,
      p_source_url,
      v_canonical_url,
      v_source_domain,
      nullif(trim(coalesce(p_source_item_id, '')), ''),
      v_source_identity_key,
      now(),
      now(),
      'active',
      p_duplicate_decision,
      coalesce(p_duplicate_reason_codes, ARRAY[]::text[]),
      p_matched_property_id,
      p_confidence_score,
      p_raw_extracted_data
    ) RETURNING id INTO v_observation_id;
  ELSE
    UPDATE public.property_source_observations
    SET property_id = coalesce(p_property_id, property_source_observations.property_id),
        import_job_id = coalesce(p_import_job_id, property_source_observations.import_job_id),
        import_job_item_id = coalesce(p_import_job_item_id, property_source_observations.import_job_item_id),
        source_type = v_source_type,
        source_url = p_source_url,
        canonical_source_url = v_canonical_url,
        source_domain = v_source_domain,
        source_item_id = coalesce(nullif(trim(coalesce(p_source_item_id, '')), ''), property_source_observations.source_item_id),
        last_seen_at = now(),
        last_scraped_at = now(),
        observation_status = 'active',
        duplicate_decision = coalesce(p_duplicate_decision, property_source_observations.duplicate_decision),
        duplicate_reason_codes = coalesce(p_duplicate_reason_codes, property_source_observations.duplicate_reason_codes, ARRAY[]::text[]),
        matched_property_id = coalesce(p_matched_property_id, property_source_observations.matched_property_id),
        confidence_score = coalesce(p_confidence_score, property_source_observations.confidence_score),
        raw_extracted_data = coalesce(p_raw_extracted_data, property_source_observations.raw_extracted_data),
        updated_at = now()
    WHERE id = v_observation_id;
  END IF;

  RETURN v_observation_id;
END;
$$;

-- Trigger keeps observation history in sync for imported/sourced properties.
CREATE OR REPLACE FUNCTION public.sync_property_source_observation_from_property()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_source_type text;
  v_source_item_id text;
BEGIN
  IF NEW.source_url IS NULL OR NEW.import_source IS NULL THEN
    RETURN NEW;
  END IF;

  v_source_type := public.normalize_listing_source_type(NEW.import_source, NEW.source_url);
  v_source_item_id := NEW.source_item_id;

  PERFORM public.record_property_source_observation(
    NEW.id,
    coalesce(NEW.primary_agency_id, NEW.claimed_by_agency_id),
    NULL,
    NULL,
    v_source_type,
    NEW.source_url,
    v_source_item_id,
    CASE WHEN TG_OP = 'INSERT' THEN 'property_created_or_backfilled' ELSE 'property_source_refreshed' END,
    ARRAY['property_source_sync'],
    NEW.id,
    NEW.data_quality_score,
    NULL
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_property_source_observation ON public.properties;
CREATE TRIGGER trg_sync_property_source_observation
AFTER INSERT OR UPDATE OF source_url, import_source, source_item_id, source_identity_key, primary_agency_id, claimed_by_agency_id, source_last_checked_at
ON public.properties
FOR EACH ROW
WHEN (NEW.source_url IS NOT NULL AND NEW.import_source IS NOT NULL)
EXECUTE FUNCTION public.sync_property_source_observation_from_property();

-- Backfill source identity fields with normalized source type where Phase 1 only had raw import_source.
UPDATE public.properties p
SET canonical_source_url = coalesce(p.canonical_source_url, public.normalize_url(p.source_url)),
    source_identity_key = coalesce(
      p.source_identity_key,
      public.build_source_identity_key(public.normalize_listing_source_type(p.import_source, p.source_url), p.source_url, p.source_item_id)
    ),
    source_domain = coalesce(
      p.source_domain,
      CASE WHEN public.normalize_url(p.source_url) IS NULL THEN NULL ELSE lower(regexp_replace(public.normalize_url(p.source_url), '^https?://([^/]+).*$','\1')) END
    ),
    source_identity_reason = coalesce(p.source_identity_reason, 'phase_2_backfill')
WHERE p.source_url IS NOT NULL
  AND p.import_source IS NOT NULL;

-- Backfill observations for existing sourced listings.
INSERT INTO public.property_source_observations (
  property_id,
  agency_id,
  source_type,
  source_url,
  canonical_source_url,
  source_domain,
  source_item_id,
  source_identity_key,
  first_seen_at,
  last_seen_at,
  last_scraped_at,
  observation_status,
  duplicate_decision,
  duplicate_reason_codes,
  matched_property_id,
  confidence_score
)
SELECT
  p.id,
  coalesce(p.primary_agency_id, p.claimed_by_agency_id),
  public.normalize_listing_source_type(p.import_source, p.source_url),
  p.source_url,
  public.normalize_url(p.source_url),
  CASE WHEN public.normalize_url(p.source_url) IS NULL THEN NULL ELSE lower(regexp_replace(public.normalize_url(p.source_url), '^https?://([^/]+).*$','\1')) END,
  p.source_item_id,
  public.build_source_identity_key(public.normalize_listing_source_type(p.import_source, p.source_url), p.source_url, p.source_item_id),
  coalesce(p.created_at, now()),
  coalesce(p.source_last_checked_at, p.updated_at, now()),
  coalesce(p.source_last_checked_at, p.updated_at, now()),
  coalesce(p.source_status, 'active'),
  'phase_2_backfill',
  ARRAY['existing_sourced_property'],
  p.id,
  p.data_quality_score
FROM public.properties p
WHERE p.source_url IS NOT NULL
  AND p.import_source IS NOT NULL
  AND public.build_source_identity_key(public.normalize_listing_source_type(p.import_source, p.source_url), p.source_url, p.source_item_id) IS NOT NULL
ON CONFLICT DO NOTHING;

-- Attach completed import items to observations where possible.
UPDATE public.property_source_observations o
SET import_job_item_id = iji.id,
    import_job_id = iji.job_id,
    duplicate_decision = coalesce(iji.duplicate_decision, o.duplicate_decision),
    duplicate_reason_codes = coalesce(iji.duplicate_reason_codes, o.duplicate_reason_codes),
    raw_extracted_data = coalesce(iji.extracted_data, o.raw_extracted_data),
    updated_at = now()
FROM public.import_job_items iji
WHERE iji.property_id = o.property_id
  AND public.normalize_url(iji.url) = o.canonical_source_url
  AND o.import_job_item_id IS NULL;
