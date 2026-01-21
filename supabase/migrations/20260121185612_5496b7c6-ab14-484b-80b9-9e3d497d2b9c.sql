-- Add price history fields to properties
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS original_price bigint,
ADD COLUMN IF NOT EXISTS price_reduced_at timestamptz;

-- Add price history fields to projects
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS original_price_from bigint,
ADD COLUMN IF NOT EXISTS price_reduced_at timestamptz;

-- Add rental budget to buyer_profiles
ALTER TABLE public.buyer_profiles
ADD COLUMN IF NOT EXISTS rental_budget integer;

-- Create recently viewed projects table
CREATE TABLE IF NOT EXISTS public.recently_viewed_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now(),
  UNIQUE(user_id, project_id)
);

-- Enable RLS
ALTER TABLE public.recently_viewed_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for recently viewed projects
CREATE POLICY "Users can view their own recently viewed projects"
ON public.recently_viewed_projects
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recently viewed projects"
ON public.recently_viewed_projects
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recently viewed projects"
ON public.recently_viewed_projects
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_recently_viewed_projects_user_id 
ON public.recently_viewed_projects(user_id, viewed_at DESC);

-- Trigger to track price reductions on properties
CREATE OR REPLACE FUNCTION public.track_property_price_reduction()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS NOT NULL AND NEW.price < OLD.price THEN
    NEW.original_price := COALESCE(OLD.original_price, OLD.price);
    NEW.price_reduced_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS properties_price_reduction_trigger ON public.properties;
CREATE TRIGGER properties_price_reduction_trigger
BEFORE UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.track_property_price_reduction();

-- Trigger to track price reductions on projects
CREATE OR REPLACE FUNCTION public.track_project_price_reduction()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price_from IS NOT NULL AND NEW.price_from < OLD.price_from THEN
    NEW.original_price_from := COALESCE(OLD.original_price_from, OLD.price_from);
    NEW.price_reduced_at := now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS projects_price_reduction_trigger ON public.projects;
CREATE TRIGGER projects_price_reduction_trigger
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.track_project_price_reduction();

-- Trigger to increment project views (reuse pattern from properties)
DROP TRIGGER IF EXISTS increment_project_views_trigger ON public.recently_viewed_projects;
CREATE TRIGGER increment_project_views_trigger
AFTER INSERT ON public.recently_viewed_projects
FOR EACH ROW EXECUTE FUNCTION public.increment_project_views();