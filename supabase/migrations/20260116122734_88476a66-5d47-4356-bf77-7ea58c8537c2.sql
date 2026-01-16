-- Create table for CBS district price indices
CREATE TABLE public.district_price_index (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district_name TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,
  month INTEGER,
  period_type TEXT NOT NULL CHECK (period_type IN ('year', 'quarter', 'month')),
  index_value DECIMAL NOT NULL,
  index_base_year TEXT DEFAULT 'Oct-Nov 2017=414.5',
  yoy_change_percent DECIMAL,
  qoq_change_percent DECIMAL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(district_name, year, quarter, month, period_type)
);

-- Enable RLS (public read access for market data)
ALTER TABLE public.district_price_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to district price index" 
ON public.district_price_index 
FOR SELECT 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_district_price_index_lookup ON public.district_price_index(district_name, period_type, year);

-- Add comment for documentation
COMMENT ON TABLE public.district_price_index IS 'CBS Housing Price Index data by district. Base year: Oct-Nov 2017 = 414.5. Data from 2017-2025.';