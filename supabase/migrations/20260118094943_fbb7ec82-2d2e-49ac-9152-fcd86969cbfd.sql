-- =============================================
-- PHASE 1A: Agent/Agency Portal Database Schema
-- =============================================

-- 1. Create verification_status enum for properties
CREATE TYPE public.verification_status AS ENUM ('draft', 'pending_review', 'changes_requested', 'approved', 'rejected');

-- 2. Create agent_status enum for agents
CREATE TYPE public.agent_status AS ENUM ('pending', 'active', 'suspended');

-- 3. Add verification workflow columns to properties table
ALTER TABLE public.properties 
ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'draft',
ADD COLUMN rejection_reason TEXT,
ADD COLUMN admin_notes TEXT,
ADD COLUMN submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN reviewed_by UUID REFERENCES auth.users(id);

-- 4. Enhance agents table with status and approval tracking
ALTER TABLE public.agents
ADD COLUMN status public.agent_status NOT NULL DEFAULT 'pending',
ADD COLUMN joined_via TEXT DEFAULT 'direct',
ADD COLUMN approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN approved_by UUID REFERENCES auth.users(id);

-- 5. Enhance agencies table with admin and invite management
ALTER TABLE public.agencies
ADD COLUMN admin_user_id UUID REFERENCES auth.users(id),
ADD COLUMN default_invite_code TEXT UNIQUE,
ADD COLUMN is_accepting_agents BOOLEAN DEFAULT true;

-- 6. Create agency_invites table for invite code management
CREATE TABLE public.agency_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    created_by UUID REFERENCES auth.users(id),
    uses_remaining INTEGER DEFAULT 1,
    max_uses INTEGER DEFAULT 1,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Create agency_join_requests table
CREATE TABLE public.agency_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT,
    rejection_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES auth.users(id),
    UNIQUE(agent_id, agency_id)
);

-- 8. Create property_views table for analytics
CREATE TABLE public.property_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    viewer_user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    source TEXT DEFAULT 'direct',
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Create property_inquiries table for lead tracking
CREATE TABLE public.property_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    inquiry_type TEXT NOT NULL CHECK (inquiry_type IN ('whatsapp', 'call', 'email', 'contact_form')),
    name TEXT,
    email TEXT,
    phone TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 10. Enable RLS on new tables
ALTER TABLE public.agency_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies for agency_invites
CREATE POLICY "Agency admins can manage their invites"
ON public.agency_invites
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.agencies 
        WHERE id = agency_id AND admin_user_id = auth.uid()
    )
);

CREATE POLICY "Anyone can read active invite codes for validation"
ON public.agency_invites
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- 12. RLS Policies for agency_join_requests
CREATE POLICY "Agents can view their own requests"
ON public.agency_join_requests
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE id = agent_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Agents can create their own requests"
ON public.agency_join_requests
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE id = agent_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Agency admins can view and manage requests"
ON public.agency_join_requests
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.agencies 
        WHERE id = agency_id AND admin_user_id = auth.uid()
    )
);

-- 13. RLS Policies for property_views (insert only for tracking, read for owners)
CREATE POLICY "Anyone can insert property views"
ON public.property_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Agents can view their own property views"
ON public.property_views
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.properties p
        JOIN public.agents a ON p.agent_id = a.id
        WHERE p.id = property_id AND a.user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all property views"
ON public.property_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 14. RLS Policies for property_inquiries
CREATE POLICY "Users can create inquiries"
ON public.property_inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Agents can view inquiries for their properties"
ON public.property_inquiries
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.agents 
        WHERE id = agent_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Admins can view all inquiries"
ON public.property_inquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- 15. Create indexes for performance
CREATE INDEX idx_property_views_property_id ON public.property_views(property_id);
CREATE INDEX idx_property_views_viewed_at ON public.property_views(viewed_at);
CREATE INDEX idx_property_inquiries_property_id ON public.property_inquiries(property_id);
CREATE INDEX idx_property_inquiries_agent_id ON public.property_inquiries(agent_id);
CREATE INDEX idx_properties_verification_status ON public.properties(verification_status);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_agency_invites_code ON public.agency_invites(code);

-- 16. Update trigger for agency_invites
CREATE TRIGGER update_agency_invites_updated_at
BEFORE UPDATE ON public.agency_invites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 17. Function to validate and use invite code
CREATE OR REPLACE FUNCTION public.use_agency_invite_code(invite_code TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_agency_id UUID;
    v_uses_remaining INTEGER;
BEGIN
    -- Find the invite and check validity
    SELECT agency_id, uses_remaining INTO v_agency_id, v_uses_remaining
    FROM public.agency_invites
    WHERE code = invite_code
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
      AND (uses_remaining IS NULL OR uses_remaining > 0);
    
    IF v_agency_id IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Decrement uses if limited
    IF v_uses_remaining IS NOT NULL THEN
        UPDATE public.agency_invites
        SET uses_remaining = uses_remaining - 1,
            is_active = CASE WHEN uses_remaining - 1 <= 0 THEN false ELSE true END
        WHERE code = invite_code;
    END IF;
    
    RETURN v_agency_id;
END;
$$;