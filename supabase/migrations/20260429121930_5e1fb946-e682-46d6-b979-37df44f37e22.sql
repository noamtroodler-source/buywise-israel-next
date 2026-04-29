-- Phase 9: safe image-signal duplicate matching

ALTER TABLE public.image_hashes
  ADD COLUMN IF NOT EXISTS image_role text NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS source_type text,
  ADD COLUMN IF NOT EXISTS signal_strength text NOT NULL DEFAULT 'exact_sha256';

ALTER TABLE public.image_hashes
  DROP CONSTRAINT IF EXISTS image_hashes_image_role_check;

ALTER TABLE public.image_hashes
  ADD CONSTRAINT image_hashes_image_role_check
  CHECK (image_role IN ('unknown', 'interior', 'exterior', 'floorplan', 'logo_or_branding', 'map_or_area'));

CREATE INDEX IF NOT EXISTS idx_image_hashes_sha256_property
  ON public.image_hashes(sha256, property_id);

CREATE OR REPLACE FUNCTION public.find_property_image_overlap(
  p_sha256s text[],
  p_exclude_property_id uuid DEFAULT NULL,
  p_min_overlap integer DEFAULT 2,
  p_limit integer DEFAULT 10
)
RETURNS TABLE(
  property_id uuid,
  overlap_count integer,
  image_roles text[],
  reason_codes text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH incoming_hashes AS (
    SELECT DISTINCT nullif(trim(v), '') AS sha256
    FROM unnest(coalesce(p_sha256s, ARRAY[]::text[])) AS v
    WHERE nullif(trim(v), '') IS NOT NULL
  ), image_overlap_rows AS (
    SELECT
      ih.property_id,
      count(DISTINCT ih.sha256)::integer AS overlap_count,
      array_agg(DISTINCT coalesce(ih.image_role, 'unknown') ORDER BY coalesce(ih.image_role, 'unknown')) AS image_roles
    FROM public.image_hashes ih
    JOIN incoming_hashes i ON i.sha256 = ih.sha256
    WHERE ih.property_id IS NOT NULL
      AND (p_exclude_property_id IS NULL OR ih.property_id <> p_exclude_property_id)
      AND coalesce(ih.image_role, 'unknown') NOT IN ('logo_or_branding', 'map_or_area')
    GROUP BY ih.property_id
    HAVING count(DISTINCT ih.sha256) >= greatest(coalesce(p_min_overlap, 2), 1)
  )
  SELECT
    o.property_id,
    o.overlap_count,
    o.image_roles,
    public.normalize_duplicate_reason_codes(
      ARRAY[
        CASE WHEN o.overlap_count >= 3 THEN 'multiple_image_exact_overlap' ELSE 'image_exact_overlap' END,
        CASE WHEN 'floorplan' = ANY(o.image_roles) THEN 'floorplan_image_overlap' END,
        CASE WHEN 'interior' = ANY(o.image_roles) THEN 'interior_image_overlap' END,
        CASE WHEN o.image_roles = ARRAY['exterior']::text[] THEN 'exterior_image_only' END
      ],
      CASE WHEN o.overlap_count >= 3 THEN 'high_confidence_same_unit' ELSE 'possible_same_unit' END,
      jsonb_build_object('image_overlap_count', o.overlap_count),
      jsonb_build_object('action', 'image_overlap_duplicate_signal')
    ) AS reason_codes
  FROM image_overlap_rows o
  ORDER BY o.overlap_count DESC
  LIMIT coalesce(p_limit, 10);
$$;