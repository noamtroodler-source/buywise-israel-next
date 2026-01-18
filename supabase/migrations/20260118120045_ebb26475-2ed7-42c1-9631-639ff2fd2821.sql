-- Phase 1: Developer Portal Database Setup

-- 1.1 Add 'developer' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'developer';

-- 1.2 Add columns to developers table for user linking and verification
ALTER TABLE public.developers 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS approved_by UUID;

-- 1.3 Add verification workflow columns to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'draft' CHECK (verification_status IN ('draft', 'pending_review', 'approved', 'changes_requested', 'rejected')),
ADD COLUMN IF NOT EXISTS admin_feedback TEXT,
ADD COLUMN IF NOT EXISTS last_renewed_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reviewed_by UUID;

-- 1.4 Create project_views table for analytics
CREATE TABLE IF NOT EXISTS public.project_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1.5 Create project_inquiries table for tracking buyer interest
CREATE TABLE IF NOT EXISTS public.project_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    developer_id UUID NOT NULL REFERENCES public.developers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    preferred_unit_type TEXT,
    budget_range TEXT,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.project_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_inquiries ENABLE ROW LEVEL SECURITY;

-- 1.6 RLS Policies for project_views
CREATE POLICY "Anyone can insert project views"
ON public.project_views
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Developers can view their project views"
ON public.project_views
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.developers d ON p.developer_id = d.id
        WHERE p.id = project_views.project_id
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- 1.7 RLS Policies for project_inquiries
CREATE POLICY "Anyone can submit project inquiries"
ON public.project_inquiries
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Developers can view their project inquiries"
ON public.project_inquiries
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.developers d
        WHERE d.id = project_inquiries.developer_id
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Developers can update their project inquiries"
ON public.project_inquiries
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.developers d
        WHERE d.id = project_inquiries.developer_id
        AND d.user_id = auth.uid()
    )
);

-- 1.8 RLS Policies for developers table (update for self-management)
CREATE POLICY "Developers can view their own profile"
ON public.developers
FOR SELECT
USING (user_id = auth.uid() OR is_verified = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Developers can update their own profile"
ON public.developers
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can insert developer profile"
ON public.developers
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- 1.9 Update projects RLS for developer management
CREATE POLICY "Developers can manage their own projects"
ON public.projects
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.developers d
        WHERE d.id = projects.developer_id
        AND d.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
);

-- 1.10 Create trigger for project views count increment
CREATE OR REPLACE FUNCTION public.increment_project_views()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.projects
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = NEW.project_id;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_project_view_insert
AFTER INSERT ON public.project_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_project_views();

-- 1.11 Create index for performance
CREATE INDEX IF NOT EXISTS idx_project_views_project_id ON public.project_views(project_id);
CREATE INDEX IF NOT EXISTS idx_project_views_created_at ON public.project_views(created_at);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_developer_id ON public.project_inquiries(developer_id);
CREATE INDEX IF NOT EXISTS idx_project_inquiries_project_id ON public.project_inquiries(project_id);
CREATE INDEX IF NOT EXISTS idx_developers_user_id ON public.developers(user_id);