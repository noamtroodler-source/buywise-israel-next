
-- Create city_rental_verification table for audit trail of verified rental/yield data
CREATE TABLE public.city_rental_verification (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_slug text NOT NULL REFERENCES public.cities(slug) ON DELETE CASCADE,
  room_count integer NOT NULL, -- 3, 4, 5 for rental data; 0 for city-level yield
  rent_min numeric,
  rent_max numeric,
  rent_avg numeric,
  yield_min numeric,
  yield_max numeric,
  source text NOT NULL DEFAULT 'BuyWise Estimate',
  verified_at date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'verified',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (city_slug, room_count)
);

-- Enable RLS (admin-only reference data)
ALTER TABLE public.city_rental_verification ENABLE ROW LEVEL SECURITY;

-- Public read access (no sensitive data)
CREATE POLICY "Anyone can read verification data"
  ON public.city_rental_verification FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "Admins can manage verification data"
  ON public.city_rental_verification FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-update timestamp
CREATE TRIGGER update_city_rental_verification_updated_at
  BEFORE UPDATE ON public.city_rental_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for quick lookups
CREATE INDEX idx_city_rental_verification_slug ON public.city_rental_verification(city_slug);
