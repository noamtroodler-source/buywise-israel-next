-- Fix 3: Create safe public view for agencies (excludes default_invite_code and admin_user_id)
CREATE OR REPLACE VIEW public.agencies_public AS
SELECT 
  id, name, slug, logo_url, description, website, phone, email,
  office_address, cities_covered, specializations, founded_year,
  social_links, office_hours, is_verified, is_accepting_agents,
  verification_status, created_at, updated_at
FROM public.agencies;

-- Grant access to the view
GRANT SELECT ON public.agencies_public TO anon, authenticated;