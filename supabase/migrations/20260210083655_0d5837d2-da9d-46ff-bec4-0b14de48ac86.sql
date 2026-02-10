
CREATE OR REPLACE FUNCTION public.get_city_property_counts(p_listing_status text)
RETURNS TABLE(city text, count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT p.city, COUNT(*)::bigint
  FROM public.properties p
  WHERE p.listing_status = p_listing_status::listing_status
    AND p.is_published = true
    AND p.city IS NOT NULL
  GROUP BY p.city;
$$;
