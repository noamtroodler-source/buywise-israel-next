-- Create rental_prices table
CREATE TABLE public.rental_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city TEXT NOT NULL,
  rooms INTEGER NOT NULL CHECK (rooms >= 1 AND rooms <= 7),
  price_min NUMERIC NOT NULL,
  price_max NUMERIC NOT NULL,
  currency TEXT DEFAULT '₪',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(city, rooms)
);

-- Enable RLS
ALTER TABLE public.rental_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access (rental prices are public data)
CREATE POLICY "Rental prices are viewable by everyone"
  ON public.rental_prices FOR SELECT
  USING (true);

-- Allow admins to manage rental prices
CREATE POLICY "Admins can manage rental prices"
  ON public.rental_prices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));