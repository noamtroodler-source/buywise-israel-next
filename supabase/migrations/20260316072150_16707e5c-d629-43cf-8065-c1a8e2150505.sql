
CREATE TABLE public.neighborhood_cbs_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  anglo_name TEXT NOT NULL,
  cbs_neighborhood_id TEXT NOT NULL,
  cbs_hebrew TEXT,
  confidence TEXT NOT NULL DEFAULT 'likely',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city, anglo_name)
);

-- RLS
ALTER TABLE public.neighborhood_cbs_mappings ENABLE ROW LEVEL SECURITY;

-- Public read for approved mappings (no auth needed for user-facing data)
CREATE POLICY "Anyone can read approved mappings"
  ON public.neighborhood_cbs_mappings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'approved');

-- Admins can read all mappings
CREATE POLICY "Admins can read all mappings"
  ON public.neighborhood_cbs_mappings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert/update/delete
CREATE POLICY "Admins can insert mappings"
  ON public.neighborhood_cbs_mappings
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update mappings"
  ON public.neighborhood_cbs_mappings
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete mappings"
  ON public.neighborhood_cbs_mappings
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Index for efficient lookups
CREATE INDEX idx_neighborhood_cbs_mappings_city ON public.neighborhood_cbs_mappings(city);
CREATE INDEX idx_neighborhood_cbs_mappings_status ON public.neighborhood_cbs_mappings(status);
CREATE INDEX idx_neighborhood_cbs_mappings_cbs_id ON public.neighborhood_cbs_mappings(cbs_neighborhood_id);
