
-- 1. Add total_saves to properties
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS total_saves integer NOT NULL DEFAULT 0;

-- 2. Add total_saves to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS total_saves integer NOT NULL DEFAULT 0;

-- 3. Backfill properties total_saves from current favorites + guest_property_saves
UPDATE public.properties p
SET total_saves = (
  SELECT COALESCE((SELECT count(*) FROM public.favorites f WHERE f.property_id = p.id), 0)
       + COALESCE((SELECT count(*) FROM public.guest_property_saves g WHERE g.property_id = p.id), 0)
);

-- 4. Backfill projects total_saves from current project_favorites
UPDATE public.projects pr
SET total_saves = (
  SELECT COALESCE(count(*), 0) FROM public.project_favorites pf WHERE pf.project_id = pr.id
);

-- 5. Update RPC to read from column instead of counting rows
CREATE OR REPLACE FUNCTION public.get_property_saves_count(p_property_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(total_saves, 0) FROM public.properties WHERE id = p_property_id;
$function$;

-- 6. Trigger function to increment property total_saves
CREATE OR REPLACE FUNCTION public.increment_property_total_saves()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.properties SET total_saves = total_saves + 1 WHERE id = NEW.property_id;
  RETURN NEW;
END;
$function$;

-- 7. Trigger on favorites INSERT
CREATE TRIGGER trg_increment_property_saves_on_favorite
  AFTER INSERT ON public.favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_property_total_saves();

-- 8. Trigger on guest_property_saves INSERT
CREATE TRIGGER trg_increment_property_saves_on_guest_save
  AFTER INSERT ON public.guest_property_saves
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_property_total_saves();

-- 9. Trigger function to increment project total_saves
CREATE OR REPLACE FUNCTION public.increment_project_total_saves()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.projects SET total_saves = total_saves + 1 WHERE id = NEW.project_id;
  RETURN NEW;
END;
$function$;

-- 10. Trigger on project_favorites INSERT
CREATE TRIGGER trg_increment_project_saves_on_favorite
  AFTER INSERT ON public.project_favorites
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_project_total_saves();
