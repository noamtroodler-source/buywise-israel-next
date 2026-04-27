CREATE OR REPLACE FUNCTION public.delete_provisioning_agency(p_agency_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_agency record;
  v_property_ids uuid[] := ARRAY[]::uuid[];
  v_agent_ids uuid[] := ARRAY[]::uuid[];
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT id, name, management_status
  INTO v_agency
  FROM public.agencies
  WHERE id = p_agency_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', true, 'deleted', false, 'reason', 'not_found');
  END IF;

  SELECT COALESCE(array_agg(id), ARRAY[]::uuid[])
  INTO v_agent_ids
  FROM public.agents
  WHERE agency_id = p_agency_id;

  SELECT COALESCE(array_agg(DISTINCT id), ARRAY[]::uuid[])
  INTO v_property_ids
  FROM public.properties
  WHERE primary_agency_id = p_agency_id
     OR claimed_by_agency_id = p_agency_id
     OR boosted_by_agency_id = p_agency_id
     OR (array_length(v_agent_ids, 1) IS NOT NULL AND agent_id = ANY(v_agent_ids));

  IF array_length(v_property_ids, 1) IS NOT NULL THEN
    DELETE FROM public.favorites WHERE property_id = ANY(v_property_ids);
    DELETE FROM public.property_views WHERE property_id = ANY(v_property_ids);
    DELETE FROM public.property_inquiries WHERE property_id = ANY(v_property_ids) OR agency_id = p_agency_id;
    DELETE FROM public.featured_listings WHERE property_id = ANY(v_property_ids) OR agency_id = p_agency_id;
    DELETE FROM public.listing_claim_requests WHERE property_id = ANY(v_property_ids) OR agency_id = p_agency_id;
    DELETE FROM public.property_co_agents WHERE property_id = ANY(v_property_ids) OR agency_id = p_agency_id;
    DELETE FROM public.primary_agency_history WHERE property_id = ANY(v_property_ids) OR new_agency_id = p_agency_id OR previous_agency_id = p_agency_id;
    DELETE FROM public.primary_disputes WHERE property_id = ANY(v_property_ids) OR disputing_agency_id = p_agency_id OR target_agency_id = p_agency_id;
    DELETE FROM public.co_listing_requests WHERE existing_property_id = ANY(v_property_ids) OR requesting_agency_id = p_agency_id OR existing_agency_id = p_agency_id;
    DELETE FROM public.cross_agency_conflicts WHERE existing_property_id = ANY(v_property_ids) OR attempted_agency_id = p_agency_id OR existing_agency_id = p_agency_id;
    DELETE FROM public.duplicate_pairs WHERE property_a = ANY(v_property_ids) OR property_b = ANY(v_property_ids);
    DELETE FROM public.properties WHERE id = ANY(v_property_ids);
  ELSE
    DELETE FROM public.property_inquiries WHERE agency_id = p_agency_id;
    DELETE FROM public.featured_listings WHERE agency_id = p_agency_id;
    DELETE FROM public.listing_claim_requests WHERE agency_id = p_agency_id;
    DELETE FROM public.property_co_agents WHERE agency_id = p_agency_id;
    DELETE FROM public.primary_agency_history WHERE new_agency_id = p_agency_id OR previous_agency_id = p_agency_id;
    DELETE FROM public.primary_disputes WHERE disputing_agency_id = p_agency_id OR target_agency_id = p_agency_id;
    DELETE FROM public.co_listing_requests WHERE requesting_agency_id = p_agency_id OR existing_agency_id = p_agency_id;
    DELETE FROM public.cross_agency_conflicts WHERE attempted_agency_id = p_agency_id OR existing_agency_id = p_agency_id;
  END IF;

  DELETE FROM public.import_conflicts WHERE agency_id = p_agency_id;
  DELETE FROM public.import_job_costs WHERE job_id IN (SELECT id FROM public.import_jobs WHERE agency_id = p_agency_id);
  DELETE FROM public.import_job_items WHERE job_id IN (SELECT id FROM public.import_jobs WHERE agency_id = p_agency_id);
  DELETE FROM public.import_jobs WHERE agency_id = p_agency_id;

  IF array_length(v_agent_ids, 1) IS NOT NULL THEN
    UPDATE public.projects SET representing_agent_id = NULL WHERE representing_agent_id = ANY(v_agent_ids);
    UPDATE public.property_inquiries SET assigned_to = NULL WHERE assigned_to = ANY(v_agent_ids);
    DELETE FROM public.inquiries WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM public.lead_response_events WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM public.listing_lifecycle WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM public.agency_join_requests WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM public.agent_notifications WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM public.agents WHERE id = ANY(v_agent_ids);
  END IF;

  DELETE FROM public.agency_provisioning_audit WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_provisioning_notes WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_source_blocklist WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_sources WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_announcements WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_notifications WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_invites WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_join_requests WHERE agency_id = p_agency_id;
  DELETE FROM public.agency_testimonials WHERE agency_id = p_agency_id;
  DELETE FROM public.founding_partners WHERE agency_id = p_agency_id;
  DELETE FROM public.password_setup_tokens WHERE agency_id = p_agency_id;
  DELETE FROM public.provisional_credentials WHERE agency_id = p_agency_id;
  DELETE FROM public.yad2_scrape_queue WHERE agency_id = p_agency_id;

  DELETE FROM public.agencies WHERE id = p_agency_id;

  RETURN jsonb_build_object(
    'success', true,
    'deleted', true,
    'agencyId', p_agency_id,
    'agencyName', v_agency.name,
    'deletedProperties', COALESCE(array_length(v_property_ids, 1), 0),
    'deletedAgents', COALESCE(array_length(v_agent_ids, 1), 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_provisioning_agency(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_provisioning_agency(uuid) TO authenticated;