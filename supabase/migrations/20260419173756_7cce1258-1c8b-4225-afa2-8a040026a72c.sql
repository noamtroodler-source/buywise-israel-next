
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS floor_number integer,
  ADD COLUMN IF NOT EXISTS apartment_number text;

CREATE INDEX IF NOT EXISTS idx_properties_floor_apt
  ON public.properties(city, floor_number, apartment_number)
  WHERE is_published = true;
