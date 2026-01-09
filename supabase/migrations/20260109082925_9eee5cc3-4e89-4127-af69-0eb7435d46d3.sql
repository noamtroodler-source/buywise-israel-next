-- Create agencies table
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  description TEXT,
  founded_year INTEGER,
  website TEXT,
  email TEXT,
  phone TEXT,
  is_verified BOOLEAN DEFAULT false,
  cities_covered TEXT[],
  specializations TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Agencies are viewable by everyone" 
ON public.agencies 
FOR SELECT 
USING (true);

-- Admin management
CREATE POLICY "Admins can manage agencies" 
ON public.agencies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add agency_id to agents table
ALTER TABLE public.agents 
ADD COLUMN agency_id UUID REFERENCES public.agencies(id);

-- Create trigger for updated_at
CREATE TRIGGER update_agencies_updated_at
BEFORE UPDATE ON public.agencies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial agencies based on existing agency_name values
INSERT INTO public.agencies (name, slug, description) VALUES
('RE/MAX Israel', 'remax-israel', 'One of the largest real estate networks in Israel, part of the global RE/MAX franchise.'),
('Keller Williams Israel', 'keller-williams-israel', 'International real estate company known for agent-centric culture and training programs.'),
('Anglo Real Estate', 'anglo-real-estate', 'Boutique agency specializing in helping English-speaking buyers find homes in Israel.'),
('Goldberg Realty', 'goldberg-realty', 'Trusted local agency with deep expertise in the Israeli real estate market.');

-- Update existing agents with agency_id based on agency_name
UPDATE public.agents SET agency_id = (SELECT id FROM public.agencies WHERE slug = 'remax-israel') WHERE agency_name = 'RE/MAX Israel';
UPDATE public.agents SET agency_id = (SELECT id FROM public.agencies WHERE slug = 'keller-williams-israel') WHERE agency_name = 'Keller Williams Israel';
UPDATE public.agents SET agency_id = (SELECT id FROM public.agencies WHERE slug = 'anglo-real-estate') WHERE agency_name = 'Anglo Real Estate';
UPDATE public.agents SET agency_id = (SELECT id FROM public.agencies WHERE slug = 'goldberg-realty') WHERE agency_name = 'Goldberg Realty';