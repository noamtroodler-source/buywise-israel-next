
-- Image hashes table for perceptual dedup
CREATE TABLE public.image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  phash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_image_hashes_phash ON public.image_hashes (phash);
CREATE INDEX idx_image_hashes_property ON public.image_hashes (property_id);
CREATE UNIQUE INDEX idx_image_hashes_url ON public.image_hashes (image_url);

ALTER TABLE public.image_hashes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage image hashes"
  ON public.image_hashes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Function to find similar images by Hamming distance
CREATE OR REPLACE FUNCTION public.find_similar_images(
  p_phash TEXT,
  p_threshold INTEGER DEFAULT 5,
  p_exclude_property_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  property_id UUID,
  image_url TEXT,
  phash TEXT,
  hamming_distance INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    ih.id,
    ih.property_id,
    ih.image_url,
    ih.phash,
    bit_count(ih.phash::bit(64) # p_phash::bit(64))::integer AS hamming_distance
  FROM public.image_hashes ih
  WHERE (p_exclude_property_id IS NULL OR ih.property_id != p_exclude_property_id)
    AND bit_count(ih.phash::bit(64) # p_phash::bit(64))::integer <= p_threshold
  ORDER BY hamming_distance ASC
  LIMIT p_limit;
$$;
