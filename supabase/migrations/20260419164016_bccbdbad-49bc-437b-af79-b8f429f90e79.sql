-- Cross-agency conflict tracking
CREATE TABLE public.cross_agency_conflicts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  existing_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  existing_agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  existing_source_url TEXT,
  attempted_agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  attempted_source_url TEXT NOT NULL,
  attempted_source_type TEXT,
  similarity_score INTEGER NOT NULL,
  match_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'co_listing_confirmed', 'existing_agency_confirmed', 'attempted_agency_confirmed', 'dismissed'))
);

CREATE INDEX idx_cross_agency_conflicts_existing_agency ON public.cross_agency_conflicts(existing_agency_id) WHERE status = 'pending';
CREATE INDEX idx_cross_agency_conflicts_attempted_agency ON public.cross_agency_conflicts(attempted_agency_id) WHERE status = 'pending';
CREATE INDEX idx_cross_agency_conflicts_status ON public.cross_agency_conflicts(status);
CREATE INDEX idx_cross_agency_conflicts_property ON public.cross_agency_conflicts(existing_property_id);

ALTER TABLE public.cross_agency_conflicts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all conflicts"
  ON public.cross_agency_conflicts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agency admins can view their conflicts"
  ON public.cross_agency_conflicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE (a.id = existing_agency_id OR a.id = attempted_agency_id)
        AND a.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage conflicts"
  ON public.cross_agency_conflicts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert conflicts"
  ON public.cross_agency_conflicts FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_cross_agency_conflicts_updated_at
  BEFORE UPDATE ON public.cross_agency_conflicts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-agency URL blocklist (prevents re-importing URLs they don't own)
CREATE TABLE public.agency_source_blocklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  blocked_url TEXT NOT NULL,
  reason TEXT,
  conflict_id UUID REFERENCES public.cross_agency_conflicts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agency_id, blocked_url)
);

CREATE INDEX idx_agency_source_blocklist_lookup ON public.agency_source_blocklist(agency_id, blocked_url);

ALTER TABLE public.agency_source_blocklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocklist"
  ON public.agency_source_blocklist FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agencies can view their blocklist"
  ON public.agency_source_blocklist FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agencies a
      WHERE a.id = agency_id AND a.admin_user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert blocklist entries"
  ON public.agency_source_blocklist FOR INSERT
  WITH CHECK (true);

-- Helper function: check if a property already exists from another agency
-- Returns the matching property + score, or NULL
CREATE OR REPLACE FUNCTION public.check_cross_agency_duplicate(
  p_attempted_agency_id UUID,
  p_address TEXT,
  p_city TEXT,
  p_neighborhood TEXT,
  p_size_sqm NUMERIC,
  p_bedrooms INTEGER,
  p_price NUMERIC,
  p_latitude NUMERIC,
  p_longitude NUMERIC
)
RETURNS TABLE (
  property_id UUID,
  existing_agency_id UUID,
  existing_source_url TEXT,
  similarity_score INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_norm_address TEXT;
BEGIN
  IF p_address IS NULL OR p_city IS NULL THEN
    RETURN;
  END IF;

  v_norm_address := lower(regexp_replace(p_address, '[,.\-/\\''"]', ' ', 'g'));
  v_norm_address := lower(regexp_replace(v_norm_address, '\s+', ' ', 'g'));
  v_norm_address := trim(v_norm_address);

  RETURN QUERY
  SELECT
    p.id AS property_id,
    p.agency_id AS existing_agency_id,
    p.source_url AS existing_source_url,
    (
      -- Address match: 40 pts
      CASE
        WHEN lower(regexp_replace(COALESCE(p.address, ''), '[,.\-/\\''"]', ' ', 'g')) = v_norm_address THEN 40
        WHEN p.address IS NOT NULL AND (
          position(v_norm_address IN lower(p.address)) > 0
          OR position(lower(p.address) IN v_norm_address) > 0
        ) THEN 25
        ELSE 0
      END
      -- Coordinate proximity: 30 pts (within 20m)
      + CASE
        WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
          AND abs(p.latitude - p_latitude) < 0.0002
          AND abs(p.longitude - p_longitude) < 0.0002
        THEN 30
        WHEN p_latitude IS NOT NULL AND p.latitude IS NOT NULL
          AND abs(p.latitude - p_latitude) < 0.0005
          AND abs(p.longitude - p_longitude) < 0.0005
        THEN 15
        ELSE 0
      END
      -- Size match: 15 pts
      + CASE
        WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
          AND abs(p.size_sqm - p_size_sqm) <= 5
        THEN 15
        WHEN p_size_sqm IS NOT NULL AND p.size_sqm IS NOT NULL
          AND abs(p.size_sqm - p_size_sqm) <= 10
        THEN 8
        ELSE 0
      END
      -- Bedroom match: 10 pts
      + CASE
        WHEN p_bedrooms IS NOT NULL AND p.bedrooms IS NOT NULL
          AND p.bedrooms = p_bedrooms
        THEN 10
        ELSE 0
      END
      -- Price within 5%: 5 pts
      + CASE
        WHEN p_price IS NOT NULL AND p.price IS NOT NULL AND p.price > 0
          AND abs(p.price - p_price) / GREATEST(p.price, p_price) <= 0.05
        THEN 5
        ELSE 0
      END
    )::INTEGER AS similarity_score
  FROM public.properties p
  WHERE p.is_published = true
    AND p.agency_id IS NOT NULL
    AND p.agency_id != p_attempted_agency_id
    AND lower(p.city) = lower(p_city)
    AND (p_neighborhood IS NULL OR p.neighborhood IS NULL OR lower(p.neighborhood) = lower(p_neighborhood))
    -- Bounding box pre-filter for performance
    AND (
      p_latitude IS NULL OR p.latitude IS NULL
      OR (abs(p.latitude - p_latitude) < 0.005 AND abs(p.longitude - p_longitude) < 0.005)
    )
  ORDER BY similarity_score DESC
  LIMIT 1;
END;
$$;

-- Helper: check if URL is blocklisted for an agency
CREATE OR REPLACE FUNCTION public.is_url_blocklisted(
  p_agency_id UUID,
  p_url TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_source_blocklist
    WHERE agency_id = p_agency_id AND blocked_url = p_url
  );
$$;