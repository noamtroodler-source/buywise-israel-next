-- Create function to increment views_count on properties (if not exists)
CREATE OR REPLACE FUNCTION public.increment_property_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-increment views_count
DROP TRIGGER IF EXISTS trigger_increment_property_views ON public.property_views;
CREATE TRIGGER trigger_increment_property_views
AFTER INSERT ON public.property_views
FOR EACH ROW
EXECUTE FUNCTION public.increment_property_views();