-- Create project_status enum
CREATE TYPE public.project_status AS ENUM ('planning', 'pre_sale', 'under_construction', 'completed');

-- Create developers table
CREATE TABLE public.developers (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    description TEXT,
    website TEXT,
    phone TEXT,
    email TEXT,
    founded_year INTEGER,
    total_projects INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create new construction projects table
CREATE TABLE public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    developer_id UUID REFERENCES public.developers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    city TEXT NOT NULL,
    neighborhood TEXT,
    address TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    status project_status DEFAULT 'planning',
    total_units INTEGER DEFAULT 0,
    available_units INTEGER DEFAULT 0,
    price_from NUMERIC,
    price_to NUMERIC,
    currency TEXT DEFAULT 'ILS',
    completion_date DATE,
    construction_start DATE,
    amenities TEXT[],
    images TEXT[],
    floor_plans TEXT[],
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project units table
CREATE TABLE public.project_units (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
    unit_type TEXT NOT NULL,
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    size_sqm NUMERIC,
    floor INTEGER,
    price NUMERIC,
    currency TEXT DEFAULT 'ILS',
    status TEXT DEFAULT 'available',
    floor_plan_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create market_data table for insights
CREATE TABLE public.market_data (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    city TEXT NOT NULL,
    neighborhood TEXT,
    year INTEGER NOT NULL,
    month INTEGER,
    average_price_sqm NUMERIC,
    median_price NUMERIC,
    total_transactions INTEGER,
    price_change_percent NUMERIC,
    data_type TEXT DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_data ENABLE ROW LEVEL SECURITY;

-- Developers policies
CREATE POLICY "Developers are viewable by everyone"
ON public.developers FOR SELECT USING (true);

CREATE POLICY "Admins can manage developers"
ON public.developers FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Projects policies
CREATE POLICY "Published projects are viewable by everyone"
ON public.projects FOR SELECT
USING (is_published = true);

CREATE POLICY "Admins can manage all projects"
ON public.projects FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Project units policies
CREATE POLICY "Project units are viewable by everyone"
ON public.project_units FOR SELECT USING (true);

CREATE POLICY "Admins can manage project units"
ON public.project_units FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Market data policies
CREATE POLICY "Market data is viewable by everyone"
ON public.market_data FOR SELECT USING (true);

CREATE POLICY "Admins can manage market data"
ON public.market_data FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add triggers
CREATE TRIGGER update_developers_updated_at
BEFORE UPDATE ON public.developers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();