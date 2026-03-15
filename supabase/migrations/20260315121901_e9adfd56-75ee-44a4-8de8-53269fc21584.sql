
-- Table 1: city_price_history (quarterly prices by city and room count)
CREATE TABLE public.city_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_en TEXT NOT NULL,
  rooms INTEGER NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  avg_price_nis NUMERIC,
  country_avg NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(city_en, rooms, year, quarter)
);

-- Table 2: neighborhood_price_history (quarterly prices by neighborhood and room count)
CREATE TABLE public.neighborhood_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  city_en TEXT NOT NULL,
  neighborhood_he TEXT NOT NULL,
  neighborhood_id TEXT NOT NULL,
  rooms INTEGER NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL,
  avg_price_nis NUMERIC,
  latest_avg_price NUMERIC,
  yoy_change_pct NUMERIC,
  price_increase_pct NUMERIC,
  rental_yield_pct NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(neighborhood_id, rooms, year, quarter)
);

-- Indexes for common query patterns
CREATE INDEX idx_city_price_history_city ON public.city_price_history(city_en);
CREATE INDEX idx_city_price_history_year_quarter ON public.city_price_history(year, quarter);
CREATE INDEX idx_neighborhood_price_history_city ON public.neighborhood_price_history(city_en);
CREATE INDEX idx_neighborhood_price_history_neighborhood ON public.neighborhood_price_history(neighborhood_id);
CREATE INDEX idx_neighborhood_price_history_year_quarter ON public.neighborhood_price_history(year, quarter);

-- RLS: public read-only (CBS data)
ALTER TABLE public.city_price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhood_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.city_price_history FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.neighborhood_price_history FOR SELECT USING (true);
