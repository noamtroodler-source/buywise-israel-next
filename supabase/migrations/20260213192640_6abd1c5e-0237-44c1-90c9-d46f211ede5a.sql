
-- Add min/max bedrooms columns to projects
ALTER TABLE public.projects ADD COLUMN min_bedrooms integer;
ALTER TABLE public.projects ADD COLUMN max_bedrooms integer;

-- Backfill from existing project_units data
UPDATE public.projects p
SET 
  min_bedrooms = sub.min_bed,
  max_bedrooms = sub.max_bed
FROM (
  SELECT project_id, MIN(bedrooms) as min_bed, MAX(bedrooms) as max_bed
  FROM public.project_units
  GROUP BY project_id
) sub
WHERE p.id = sub.project_id;

-- Create trigger function to keep min/max bedrooms in sync
CREATE OR REPLACE FUNCTION public.sync_project_bedroom_range()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  target_project_id UUID;
BEGIN
  -- Determine which project_id to update
  IF TG_OP = 'DELETE' THEN
    target_project_id := OLD.project_id;
  ELSE
    target_project_id := NEW.project_id;
  END IF;

  UPDATE public.projects
  SET 
    min_bedrooms = sub.min_bed,
    max_bedrooms = sub.max_bed
  FROM (
    SELECT MIN(bedrooms) as min_bed, MAX(bedrooms) as max_bed
    FROM public.project_units
    WHERE project_id = target_project_id
  ) sub
  WHERE id = target_project_id;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger on project_units
CREATE TRIGGER sync_bedroom_range_on_unit_change
AFTER INSERT OR UPDATE OR DELETE ON public.project_units
FOR EACH ROW
EXECUTE FUNCTION public.sync_project_bedroom_range();
