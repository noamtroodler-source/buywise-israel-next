CREATE OR REPLACE FUNCTION public.claim_listing(p_property_id uuid, p_agency_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN UPDATE public.properties SET is_claimed = true, claimed_at = now(), claimed_by_agency_id = p_agency_id, is_published = true, verification_status = 'approved', updated_at = now() WHERE id = p_property_id AND (is_claimed = false OR claimed_by_agency_id = p_agency_id); RETURN FOUND; END; $function$