
CREATE OR REPLACE FUNCTION public.merge_properties(p_winner_id uuid, p_loser_id uuid, p_pair_id uuid, p_admin_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_winner RECORD;
  v_loser RECORD;
  v_source_rank_winner INT;
  v_source_rank_loser INT;
  v_merged_urls TEXT[];
  v_merged_images TEXT[];
  v_merged_features TEXT[];
  v_primary_source_url TEXT;
  v_winner_img_count INT;
  v_loser_img_count INT;
BEGIN
  SELECT * INTO v_winner FROM public.properties WHERE id = p_winner_id;
  SELECT * INTO v_loser FROM public.properties WHERE id = p_loser_id;

  v_source_rank_winner := CASE v_winner.import_source
    WHEN 'yad2' THEN 1 WHEN 'madlan' THEN 2 WHEN 'website_scrape' THEN 3 ELSE 4 END;
  v_source_rank_loser := CASE v_loser.import_source
    WHEN 'yad2' THEN 1 WHEN 'madlan' THEN 2 WHEN 'website_scrape' THEN 3 ELSE 4 END;

  -- Determine primary source_url by image count
  v_winner_img_count := COALESCE(array_length(v_winner.images, 1), 0);
  v_loser_img_count := COALESCE(array_length(v_loser.images, 1), 0);

  IF v_loser_img_count > v_winner_img_count THEN
    v_primary_source_url := v_loser.source_url;
  ELSE
    v_primary_source_url := COALESCE(v_winner.source_url, v_loser.source_url);
  END IF;

  -- Merge source URLs (all non-primary URLs go here)
  v_merged_urls := ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(v_winner.merged_source_urls, ARRAY[]::TEXT[]) ||
      COALESCE(v_loser.merged_source_urls, ARRAY[]::TEXT[]) ||
      ARRAY[v_winner.source_url, v_loser.source_url]
    )
  );
  -- Remove nulls and the primary URL from merged list
  v_merged_urls := ARRAY(
    SELECT u FROM unnest(v_merged_urls) u
    WHERE u IS NOT NULL AND u IS DISTINCT FROM v_primary_source_url
  );

  -- Merge images (winner first, then unique loser images)
  v_merged_images := COALESCE(v_winner.images, ARRAY[]::TEXT[]);
  IF v_loser.images IS NOT NULL THEN
    v_merged_images := v_merged_images || ARRAY(
      SELECT unnest(v_loser.images)
      EXCEPT
      SELECT unnest(COALESCE(v_winner.images, ARRAY[]::TEXT[]))
    );
  END IF;

  -- Merge features (union)
  v_merged_features := ARRAY(
    SELECT DISTINCT unnest(
      COALESCE(v_winner.features, ARRAY[]::TEXT[]) ||
      COALESCE(v_loser.features, ARRAY[]::TEXT[])
    )
  );

  -- Enrich winner with loser's data
  UPDATE public.properties
  SET
    source_url = v_primary_source_url,
    description = CASE
      WHEN COALESCE(length(v_winner.description), 0) >= COALESCE(length(v_loser.description), 0)
      THEN COALESCE(v_winner.description, v_loser.description)
      ELSE COALESCE(v_loser.description, v_winner.description)
    END,
    description_he = CASE
      WHEN COALESCE(length(v_winner.description_he), 0) >= COALESCE(length(v_loser.description_he), 0)
      THEN COALESCE(v_winner.description_he, v_loser.description_he)
      ELSE COALESCE(v_loser.description_he, v_winner.description_he)
    END,
    latitude = CASE
      WHEN v_winner.latitude IS NOT NULL AND v_loser.latitude IS NOT NULL
      THEN CASE WHEN v_source_rank_winner <= v_source_rank_loser THEN v_winner.latitude ELSE v_loser.latitude END
      ELSE COALESCE(v_winner.latitude, v_loser.latitude)
    END,
    longitude = CASE
      WHEN v_winner.longitude IS NOT NULL AND v_loser.longitude IS NOT NULL
      THEN CASE WHEN v_source_rank_winner <= v_source_rank_loser THEN v_winner.longitude ELSE v_loser.longitude END
      ELSE COALESCE(v_winner.longitude, v_loser.longitude)
    END,
    address = CASE
      WHEN v_winner.address IS NOT NULL AND v_loser.address IS NOT NULL
      THEN CASE WHEN v_source_rank_winner <= v_source_rank_loser THEN v_winner.address ELSE v_loser.address END
      ELSE COALESCE(v_winner.address, v_loser.address)
    END,
    neighborhood = COALESCE(v_winner.neighborhood, v_loser.neighborhood),
    floor_number = COALESCE(v_winner.floor_number, v_loser.floor_number),
    year_built = COALESCE(v_winner.year_built, v_loser.year_built),
    size_sqm = CASE
      WHEN v_winner.size_sqm IS NOT NULL THEN v_winner.size_sqm
      ELSE v_loser.size_sqm
    END,
    parking_spots = COALESCE(v_winner.parking_spots, v_loser.parking_spots),
    images = v_merged_images,
    features = v_merged_features,
    merged_source_urls = v_merged_urls,
    data_quality_score = GREATEST(
      COALESCE(v_winner.data_quality_score, 0),
      COALESCE(v_loser.data_quality_score, 0)
    ),
    updated_at = now()
  WHERE id = p_winner_id;

  UPDATE public.inquiries SET property_id = p_winner_id WHERE property_id = p_loser_id;

  INSERT INTO public.favorites (user_id, property_id, created_at)
  SELECT f.user_id, p_winner_id, f.created_at
  FROM public.favorites f
  WHERE f.property_id = p_loser_id
    AND NOT EXISTS (
      SELECT 1 FROM public.favorites f2
      WHERE f2.user_id = f.user_id AND f2.property_id = p_winner_id
    )
  ON CONFLICT DO NOTHING;

  DELETE FROM public.favorites WHERE property_id = p_loser_id;

  UPDATE public.properties
  SET views_count = COALESCE(views_count, 0) + COALESCE(v_loser.views_count, 0)
  WHERE id = p_winner_id;

  UPDATE public.properties
  SET is_published = false, listing_status = 'unlisted'
  WHERE id = p_loser_id;

  UPDATE public.duplicate_pairs
  SET status = 'merged',
      merged_into = p_winner_id,
      resolved_by = p_admin_id,
      resolved_at = now()
  WHERE id = p_pair_id;
END;
$function$;
