
CREATE TABLE public.map_pois (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_he TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  city TEXT NOT NULL,
  latitude NUMERIC NOT NULL,
  longitude NUMERIC NOT NULL,
  description TEXT,
  address TEXT,
  website TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_map_pois_category ON public.map_pois (category);
CREATE INDEX idx_map_pois_city ON public.map_pois (city);
CREATE INDEX idx_map_pois_coords ON public.map_pois (latitude, longitude);

ALTER TABLE public.map_pois ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view POIs"
  ON public.map_pois FOR SELECT
  TO anon, authenticated
  USING (true);
