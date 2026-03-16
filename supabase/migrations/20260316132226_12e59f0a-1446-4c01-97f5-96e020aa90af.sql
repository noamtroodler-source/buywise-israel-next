
-- Table to track detected duplicate property pairs
CREATE TABLE public.duplicate_pairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_a UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  property_b UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
  detection_method TEXT NOT NULL DEFAULT 'phash',
  similarity_score INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  merged_into UUID REFERENCES public.properties(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(property_a, property_b)
);

CREATE INDEX idx_duplicate_pairs_status ON public.duplicate_pairs (status);
CREATE INDEX idx_duplicate_pairs_properties ON public.duplicate_pairs (property_a, property_b);

ALTER TABLE public.duplicate_pairs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage duplicate pairs"
  ON public.duplicate_pairs FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to merge two properties: transfers inquiries, favorites, views to winner
CREATE OR REPLACE FUNCTION public.merge_properties(
  p_winner_id UUID,
  p_loser_id UUID,
  p_pair_id UUID,
  p_admin_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Transfer inquiries from loser to winner
  UPDATE public.inquiries
  SET property_id = p_winner_id
  WHERE property_id = p_loser_id;

  -- Transfer favorites (skip if user already has winner favorited)
  INSERT INTO public.favorites (user_id, property_id, created_at)
  SELECT f.user_id, p_winner_id, f.created_at
  FROM public.favorites f
  WHERE f.property_id = p_loser_id
    AND NOT EXISTS (
      SELECT 1 FROM public.favorites f2
      WHERE f2.user_id = f.user_id AND f2.property_id = p_winner_id
    )
  ON CONFLICT DO NOTHING;

  -- Delete loser's remaining favorites
  DELETE FROM public.favorites WHERE property_id = p_loser_id;

  -- Sum views_count
  UPDATE public.properties
  SET views_count = COALESCE(views_count, 0) + COALESCE(
    (SELECT views_count FROM public.properties WHERE id = p_loser_id), 0
  )
  WHERE id = p_winner_id;

  -- Unpublish the loser
  UPDATE public.properties
  SET is_published = false, listing_status = 'unlisted'
  WHERE id = p_loser_id;

  -- Mark the pair as merged
  UPDATE public.duplicate_pairs
  SET status = 'merged',
      merged_into = p_winner_id,
      resolved_by = p_admin_id,
      resolved_at = now()
  WHERE id = p_pair_id;
END;
$$;
