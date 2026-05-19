UPDATE public.properties p
SET images = sub.urls,
    updated_at = now()
FROM (
  SELECT property_id, array_agg(DISTINCT image_url) AS urls
  FROM public.image_hashes
  WHERE image_url IS NOT NULL AND image_url <> ''
  GROUP BY property_id
) sub
WHERE p.id = sub.property_id
  AND (p.images IS NULL OR cardinality(p.images) = 0);