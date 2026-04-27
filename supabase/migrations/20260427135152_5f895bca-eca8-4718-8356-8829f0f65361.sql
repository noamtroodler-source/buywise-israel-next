DO $$
DECLARE
  v_agency_id uuid := '3bd15528-c95c-43e8-a7d0-a2ed55776175';
  v_deleted_short_term int := 0;
  v_merged int := 0;
  pair record;
BEGIN
  CREATE TEMP TABLE tmp_erez_active_ids(id uuid PRIMARY KEY) ON COMMIT DROP;
  INSERT INTO tmp_erez_active_ids(id)
  SELECT p.id
  FROM public.properties p
  WHERE p.primary_agency_id = v_agency_id OR p.claimed_by_agency_id = v_agency_id;

  CREATE TEMP TABLE tmp_erez_merge_pairs(winner_id uuid, loser_id uuid, reason text) ON COMMIT DROP;

  -- First remove unsupported short-term/vacation rentals from this agency's provisioning set.
  WITH short_term AS (
    SELECT p.id
    FROM public.properties p
    WHERE (p.primary_agency_id = v_agency_id OR p.claimed_by_agency_id = v_agency_id)
      AND p.listing_status = 'for_rent'
      AND (
        (p.price IS NOT NULL AND p.price > 0 AND p.price < 5000)
        OR coalesce(p.title, '') ~* '(short[- ]?term|vacation|holiday|airbnb|night|weekly)'
        OR coalesce(p.description, '') ~* '(short[- ]?term|vacation|holiday|airbnb|per night|per week|nightly|weekly)'
        OR coalesce(p.source_url, '') ~* 'לטווחים-קצרים|לטווח-קצר|חופשת|קיץ|נופש'
      )
  )
  DELETE FROM public.properties p
  USING short_term s
  WHERE p.id = s.id;
  GET DIAGNOSTICS v_deleted_short_term = ROW_COUNT;

  -- Exact original-page duplicates: same canonical source URL, imported more than once.
  INSERT INTO tmp_erez_merge_pairs(winner_id, loser_id, reason)
  WITH base AS (
    SELECT p.*,
      lower(regexp_replace(split_part(coalesce(p.source_url, ''), '?', 1), '/+$', '')) AS url_key,
      row_number() OVER (
        PARTITION BY lower(regexp_replace(split_part(coalesce(p.source_url, ''), '?', 1), '/+$', ''))
        ORDER BY coalesce(array_length(p.images, 1), 0) DESC, coalesce(p.data_quality_score, 0) DESC, length(coalesce(p.description, '')) DESC, p.created_at ASC
      ) AS rn,
      first_value(p.id) OVER (
        PARTITION BY lower(regexp_replace(split_part(coalesce(p.source_url, ''), '?', 1), '/+$', ''))
        ORDER BY coalesce(array_length(p.images, 1), 0) DESC, coalesce(p.data_quality_score, 0) DESC, length(coalesce(p.description, '')) DESC, p.created_at ASC
      ) AS winner_id
    FROM public.properties p
    WHERE (p.primary_agency_id = v_agency_id OR p.claimed_by_agency_id = v_agency_id)
      AND coalesce(p.source_url, '') <> ''
  )
  SELECT winner_id, id, 'same_source_url'
  FROM base
  WHERE rn > 1 AND url_key <> '';

  -- Same/near-price duplicate pass: conservative, focused on same agency + same type + close specs.
  INSERT INTO tmp_erez_merge_pairs(winner_id, loser_id, reason)
  WITH p AS (
    SELECT p.*,
      regexp_replace(lower(coalesce(p.address, '') || ' ' || coalesce(p.title, '') || ' ' || coalesce(p.neighborhood, '')), '[^a-z0-9א-ת]+', ' ', 'g') AS text_key
    FROM public.properties p
    WHERE (p.primary_agency_id = v_agency_id OR p.claimed_by_agency_id = v_agency_id)
      AND p.price IS NOT NULL AND p.price > 0
  ), candidates AS (
    SELECT a.id AS a_id, b.id AS b_id,
      CASE
        WHEN coalesce(array_length(a.images, 1), 0) > coalesce(array_length(b.images, 1), 0) THEN a.id
        WHEN coalesce(array_length(a.images, 1), 0) < coalesce(array_length(b.images, 1), 0) THEN b.id
        WHEN coalesce(a.data_quality_score, 0) >= coalesce(b.data_quality_score, 0) THEN a.id
        ELSE b.id
      END AS winner_id,
      CASE
        WHEN coalesce(array_length(a.images, 1), 0) > coalesce(array_length(b.images, 1), 0) THEN b.id
        WHEN coalesce(array_length(a.images, 1), 0) < coalesce(array_length(b.images, 1), 0) THEN a.id
        WHEN coalesce(a.data_quality_score, 0) >= coalesce(b.data_quality_score, 0) THEN b.id
        ELSE a.id
      END AS loser_id
    FROM p a
    JOIN p b ON a.id < b.id
      AND lower(coalesce(a.city, '')) = lower(coalesce(b.city, ''))
      AND coalesce(a.listing_status, 'for_sale') = coalesce(b.listing_status, 'for_sale')
      AND ((a.price >= 1000000 AND b.price >= 1000000) OR (a.price < 1000000 AND b.price < 1000000))
      AND abs(a.price - b.price) / greatest(a.price, b.price) <= 0.03
      AND (a.bedrooms IS NULL OR b.bedrooms IS NULL OR abs(a.bedrooms - b.bedrooms) <= 1)
      AND (
        (a.size_sqm IS NOT NULL AND b.size_sqm IS NOT NULL AND abs(a.size_sqm - b.size_sqm) <= greatest(8, greatest(a.size_sqm, b.size_sqm) * 0.10))
        OR (coalesce(a.address, '') <> '' AND coalesce(b.address, '') <> '' AND lower(a.address) = lower(b.address))
      )
  )
  SELECT c.winner_id, c.loser_id, 'same_or_near_price_specs'
  FROM candidates c
  WHERE NOT EXISTS (SELECT 1 FROM tmp_erez_merge_pairs x WHERE x.loser_id = c.winner_id OR x.winner_id = c.loser_id OR x.loser_id = c.loser_id);

  FOR pair IN SELECT DISTINCT winner_id, loser_id, reason FROM tmp_erez_merge_pairs WHERE winner_id <> loser_id LOOP
    IF NOT EXISTS (SELECT 1 FROM public.properties WHERE id = pair.winner_id)
       OR NOT EXISTS (SELECT 1 FROM public.properties WHERE id = pair.loser_id) THEN
      CONTINUE;
    END IF;

    UPDATE public.properties w
    SET
      title = CASE WHEN length(coalesce(w.title, '')) >= length(coalesce(l.title, '')) THEN w.title ELSE coalesce(l.title, w.title) END,
      description = CASE WHEN length(coalesce(w.description, '')) >= length(coalesce(l.description, '')) THEN w.description ELSE coalesce(l.description, w.description) END,
      ai_english_description = CASE WHEN length(coalesce(w.ai_english_description, '')) >= length(coalesce(l.ai_english_description, '')) THEN w.ai_english_description ELSE coalesce(l.ai_english_description, w.ai_english_description) END,
      address = coalesce(nullif(w.address, ''), nullif(l.address, ''), w.address),
      neighborhood = coalesce(w.neighborhood, l.neighborhood),
      latitude = coalesce(w.latitude, l.latitude),
      longitude = coalesce(w.longitude, l.longitude),
      bedrooms = coalesce(w.bedrooms, l.bedrooms),
      bathrooms = coalesce(w.bathrooms, l.bathrooms),
      size_sqm = coalesce(w.size_sqm, l.size_sqm),
      floor = coalesce(w.floor, l.floor),
      total_floors = coalesce(w.total_floors, l.total_floors),
      year_built = coalesce(w.year_built, l.year_built),
      parking = coalesce(w.parking, l.parking),
      condition = coalesce(w.condition, l.condition),
      ac_type = coalesce(w.ac_type, l.ac_type),
      entry_date = coalesce(w.entry_date, l.entry_date),
      vaad_bayit_monthly = coalesce(w.vaad_bayit_monthly, l.vaad_bayit_monthly),
      features = ARRAY(SELECT DISTINCT x FROM unnest(coalesce(w.features, ARRAY[]::text[]) || coalesce(l.features, ARRAY[]::text[])) AS x WHERE x IS NOT NULL AND x <> ''),
      images = ARRAY(SELECT DISTINCT x FROM unnest(coalesce(w.images, ARRAY[]::text[]) || coalesce(l.images, ARRAY[]::text[])) AS x WHERE x IS NOT NULL AND x <> ''),
      merged_source_urls = ARRAY(SELECT DISTINCT x FROM unnest(coalesce(w.merged_source_urls, ARRAY[]::text[]) || coalesce(l.merged_source_urls, ARRAY[]::text[]) || ARRAY[w.source_url, l.source_url]) AS x WHERE x IS NOT NULL AND x <> ''),
      views_count = coalesce(w.views_count, 0) + coalesce(l.views_count, 0),
      data_quality_score = greatest(coalesce(w.data_quality_score, 0), coalesce(l.data_quality_score, 0)),
      quality_audit_score = greatest(coalesce(w.quality_audit_score, 0), coalesce(l.quality_audit_score, 0)),
      updated_at = now()
    FROM public.properties l
    WHERE w.id = pair.winner_id AND l.id = pair.loser_id;

    UPDATE public.import_job_items SET property_id = pair.winner_id WHERE property_id = pair.loser_id;
    UPDATE public.outbound_clicks SET property_id = pair.winner_id WHERE property_id = pair.loser_id;
    UPDATE public.duplicate_pairs SET merged_into = pair.winner_id WHERE merged_into = pair.loser_id;
    DELETE FROM public.duplicate_pairs WHERE property_a = pair.loser_id OR property_b = pair.loser_id;

    DELETE FROM public.properties WHERE id = pair.loser_id;
    v_merged := v_merged + 1;
  END LOOP;

  RAISE NOTICE 'Erez cleanup complete: merged %, removed short-term %', v_merged, v_deleted_short_term;
END $$;