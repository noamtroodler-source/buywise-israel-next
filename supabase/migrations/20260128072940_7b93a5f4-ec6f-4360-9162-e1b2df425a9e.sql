-- ===========================================
-- SOLD TRANSACTIONS DATA INTEGRATION SCHEMA
-- ===========================================

-- 1. Create sold_transactions table
CREATE TABLE public.sold_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core transaction data
  sold_price NUMERIC NOT NULL,
  sold_date DATE NOT NULL,
  
  -- Property details
  property_type TEXT,
  rooms NUMERIC,
  size_sqm NUMERIC,
  floor INTEGER,
  year_built INTEGER,
  asset_condition TEXT,
  is_new_construction BOOLEAN DEFAULT FALSE,
  
  -- Location
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  gush_helka TEXT,
  
  -- Calculated fields
  price_per_sqm NUMERIC GENERATED ALWAYS AS (
    CASE WHEN size_sqm > 0 THEN ROUND(sold_price / size_sqm, 0) ELSE NULL END
  ) STORED,
  
  -- Metadata
  source TEXT NOT NULL,
  raw_data JSONB,
  geocoded_at TIMESTAMP WITH TIME ZONE,
  geocode_source TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Prevent duplicates
  CONSTRAINT unique_transaction UNIQUE (address, city, sold_date, sold_price)
);

-- 2. Create sold_data_imports table (audit trail)
CREATE TABLE public.sold_data_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  source TEXT NOT NULL,
  records_imported INTEGER DEFAULT 0,
  records_geocoded INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  date_range_start DATE,
  date_range_end DATE,
  imported_by TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Create indexes for efficient querying
CREATE INDEX idx_sold_transactions_city ON public.sold_transactions(city);
CREATE INDEX idx_sold_transactions_sold_date ON public.sold_transactions(sold_date DESC);
CREATE INDEX idx_sold_transactions_location ON public.sold_transactions(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX idx_sold_transactions_rooms ON public.sold_transactions(rooms);
CREATE INDEX idx_sold_transactions_property_type ON public.sold_transactions(property_type);
CREATE INDEX idx_sold_transactions_price_sqm ON public.sold_transactions(price_per_sqm);
CREATE INDEX idx_sold_transactions_city_date ON public.sold_transactions(city, sold_date DESC);

-- 4. Enable RLS
ALTER TABLE public.sold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sold_data_imports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for sold_transactions
CREATE POLICY "Anyone can view sold transactions" 
  ON public.sold_transactions FOR SELECT USING (true);

CREATE POLICY "Admins can insert sold transactions" 
  ON public.sold_transactions FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update sold transactions" 
  ON public.sold_transactions FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete sold transactions" 
  ON public.sold_transactions FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. RLS Policies for sold_data_imports
CREATE POLICY "Anyone can view import logs" 
  ON public.sold_data_imports FOR SELECT USING (true);

CREATE POLICY "Admins can insert import logs" 
  ON public.sold_data_imports FOR INSERT 
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update import logs" 
  ON public.sold_data_imports FOR UPDATE 
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete import logs" 
  ON public.sold_data_imports FOR DELETE 
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Create updated_at trigger
CREATE TRIGGER update_sold_transactions_updated_at
  BEFORE UPDATE ON public.sold_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Create get_nearby_sold_comps function for proximity queries
CREATE OR REPLACE FUNCTION public.get_nearby_sold_comps(
  p_lat NUMERIC,
  p_lng NUMERIC,
  p_city TEXT,
  p_radius_km NUMERIC DEFAULT 0.5,
  p_months_back INTEGER DEFAULT 24,
  p_limit INTEGER DEFAULT 5,
  p_min_rooms INTEGER DEFAULT NULL,
  p_max_rooms INTEGER DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  sold_price NUMERIC,
  sold_date DATE,
  rooms NUMERIC,
  size_sqm NUMERIC,
  property_type TEXT,
  price_per_sqm NUMERIC,
  distance_meters NUMERIC,
  is_same_building BOOLEAN
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT 
    st.id,
    st.sold_price,
    st.sold_date,
    st.rooms,
    st.size_sqm,
    st.property_type,
    st.price_per_sqm,
    -- Haversine formula for distance in meters
    ROUND((6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(p_lat)) * cos(radians(st.latitude)) *
        cos(radians(st.longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(st.latitude))
      ))
    ))::numeric, 0) as distance_meters,
    -- Same building = within 20 meters
    (6371000 * acos(
      LEAST(1.0, GREATEST(-1.0,
        cos(radians(p_lat)) * cos(radians(st.latitude)) *
        cos(radians(st.longitude) - radians(p_lng)) +
        sin(radians(p_lat)) * sin(radians(st.latitude))
      ))
    )) < 20 as is_same_building
  FROM sold_transactions st
  WHERE 
    st.city = p_city
    AND st.latitude IS NOT NULL
    AND st.longitude IS NOT NULL
    AND st.sold_date >= (CURRENT_DATE - (p_months_back || ' months')::interval)
    AND (p_min_rooms IS NULL OR st.rooms >= p_min_rooms)
    AND (p_max_rooms IS NULL OR st.rooms <= p_max_rooms)
    -- Pre-filter by bounding box for performance
    AND st.latitude BETWEEN (p_lat - p_radius_km/111.0) AND (p_lat + p_radius_km/111.0)
    AND st.longitude BETWEEN (p_lng - p_radius_km/85.0) AND (p_lng + p_radius_km/85.0)
  ORDER BY distance_meters ASC
  LIMIT p_limit;
$$;