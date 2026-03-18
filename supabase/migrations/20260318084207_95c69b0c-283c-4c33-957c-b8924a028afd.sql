
-- Create neighborhood_profiles table
CREATE TABLE public.neighborhood_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city text NOT NULL,
  neighborhood text NOT NULL,
  reputation text,
  physical_character text,
  proximity_anchors text,
  anglo_community text,
  daily_life text,
  transit_mobility text,
  honest_tradeoff text,
  best_for text,
  sources text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city, neighborhood)
);

-- RLS
ALTER TABLE public.neighborhood_profiles ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read neighborhood profiles"
  ON public.neighborhood_profiles FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admins can insert neighborhood profiles"
  ON public.neighborhood_profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update neighborhood profiles"
  ON public.neighborhood_profiles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete neighborhood profiles"
  ON public.neighborhood_profiles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_neighborhood_profiles_updated_at
  BEFORE UPDATE ON public.neighborhood_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
