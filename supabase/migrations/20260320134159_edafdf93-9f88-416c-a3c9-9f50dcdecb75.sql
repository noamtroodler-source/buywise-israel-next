
CREATE TABLE public.neighborhood_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  neighborhood text NOT NULL,
  neighborhood_id text,
  geojson_coords jsonb NOT NULL,
  geom_type text NOT NULL DEFAULT 'Polygon',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, neighborhood)
);

ALTER TABLE public.neighborhood_boundaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read neighborhood boundaries"
  ON public.neighborhood_boundaries
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX idx_neighborhood_boundaries_city ON public.neighborhood_boundaries (city);
