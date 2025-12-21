-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'user');

-- Create property_type enum
CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'penthouse', 'cottage', 'land', 'commercial');

-- Create listing_status enum
CREATE TYPE public.listing_status AS ENUM ('for_sale', 'for_rent', 'sold', 'rented');

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create agents table
CREATE TABLE public.agents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    bio TEXT,
    license_number TEXT,
    agency_name TEXT,
    years_experience INTEGER DEFAULT 0,
    languages TEXT[] DEFAULT ARRAY['Hebrew', 'English'],
    specializations TEXT[],
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create properties table
CREATE TABLE public.properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    property_type property_type NOT NULL DEFAULT 'apartment',
    listing_status listing_status NOT NULL DEFAULT 'for_sale',
    price NUMERIC NOT NULL,
    currency TEXT DEFAULT 'ILS',
    
    -- Location
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    neighborhood TEXT,
    latitude NUMERIC,
    longitude NUMERIC,
    
    -- Property details
    bedrooms INTEGER DEFAULT 0,
    bathrooms INTEGER DEFAULT 0,
    size_sqm NUMERIC,
    lot_size_sqm NUMERIC,
    floor INTEGER,
    total_floors INTEGER,
    year_built INTEGER,
    
    -- Features
    features TEXT[],
    images TEXT[],
    
    -- Metadata
    views_count INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create favorites table for users to save properties
CREATE TABLE public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, property_id)
);

-- Create inquiries table for property inquiries
CREATE TABLE public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
        AND role = _role
    )
$$;

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
    
    -- Assign default 'user' role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user');
    
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
    BEFORE UPDATE ON public.agents
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ RLS POLICIES ============

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- User roles policies (only admins can view/modify roles)
CREATE POLICY "Users can view their own roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
    ON public.user_roles FOR SELECT
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
    ON public.user_roles FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

-- Agents policies
CREATE POLICY "Agents are viewable by everyone"
    ON public.agents FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage agents"
    ON public.agents FOR ALL
    TO authenticated
    USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agents can update their own profile"
    ON public.agents FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid());

-- Properties policies
CREATE POLICY "Published properties are viewable by everyone"
    ON public.properties FOR SELECT
    USING (is_published = true);

CREATE POLICY "Agents can view their own unpublished properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Agents can insert properties"
    ON public.properties FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_role(auth.uid(), 'agent') OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Agents can update their own properties"
    ON public.properties FOR UPDATE
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        ) OR public.has_role(auth.uid(), 'admin')
    );

CREATE POLICY "Agents can delete their own properties"
    ON public.properties FOR DELETE
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        ) OR public.has_role(auth.uid(), 'admin')
    );

-- Favorites policies
CREATE POLICY "Users can view their own favorites"
    ON public.favorites FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
    ON public.favorites FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
    ON public.favorites FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Inquiries policies
CREATE POLICY "Users can view their own inquiries"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Agents can view inquiries for their properties"
    ON public.inquiries FOR SELECT
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can create inquiries"
    ON public.inquiries FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Agents can update inquiry read status"
    ON public.inquiries FOR UPDATE
    TO authenticated
    USING (
        agent_id IN (
            SELECT id FROM public.agents WHERE user_id = auth.uid()
        )
    );