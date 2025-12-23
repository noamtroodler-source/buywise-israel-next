-- Create buyer profile table to store user's buyer situation for personalized calculations
CREATE TABLE public.buyer_profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Residency Status
    residency_status text NOT NULL DEFAULT 'israeli_resident' 
        CHECK (residency_status IN ('israeli_resident', 'oleh_hadash', 'non_resident')),
    
    -- For Oleh Hadash: year of Aliyah (to calculate 7-year benefit window)
    aliyah_year integer,
    
    -- Property ownership status
    is_first_property boolean NOT NULL DEFAULT true,
    
    -- Purchase purpose
    purchase_purpose text NOT NULL DEFAULT 'primary_residence'
        CHECK (purchase_purpose IN ('primary_residence', 'vacation_home', 'investment', 'undecided')),
    
    -- Entity type (individual vs company)
    buyer_entity text NOT NULL DEFAULT 'individual'
        CHECK (buyer_entity IN ('individual', 'company')),
    
    -- Onboarding completion
    onboarding_completed boolean NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own buyer profile
CREATE POLICY "Users can view their own buyer profile"
ON public.buyer_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own buyer profile
CREATE POLICY "Users can insert their own buyer profile"
ON public.buyer_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own buyer profile
CREATE POLICY "Users can update their own buyer profile"
ON public.buyer_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can view all buyer profiles
CREATE POLICY "Admins can view all buyer profiles"
ON public.buyer_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_buyer_profiles_updated_at
BEFORE UPDATE ON public.buyer_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_buyer_profiles_user_id ON public.buyer_profiles(user_id);