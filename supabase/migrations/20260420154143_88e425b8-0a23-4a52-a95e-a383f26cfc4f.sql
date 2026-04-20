
DO $$
DECLARE
  v_agency_id uuid := '5f9ca0e3-6a55-4a07-acc2-6593a22c6537';
  v_property_ids uuid[];
  v_agent_ids uuid[];
  r record;
BEGIN
  SELECT array_agg(id) INTO v_agent_ids FROM agents WHERE agency_id = v_agency_id;
  SELECT array_agg(p.id) INTO v_property_ids
  FROM properties p
  WHERE p.agent_id = ANY(COALESCE(v_agent_ids, ARRAY[]::uuid[]));

  IF v_property_ids IS NOT NULL AND array_length(v_property_ids,1) > 0 THEN
    FOR r IN
      SELECT table_name FROM information_schema.columns
      WHERE table_schema='public' AND column_name='property_id' AND table_name <> 'properties'
    LOOP
      EXECUTE format('DELETE FROM public.%I WHERE property_id = ANY($1)', r.table_name) USING v_property_ids;
    END LOOP;

    FOR r IN
      SELECT c1.table_name FROM information_schema.columns c1
      JOIN information_schema.columns c2 ON c1.table_name=c2.table_name AND c1.table_schema=c2.table_schema
      WHERE c1.table_schema='public' AND c1.column_name='entity_type' AND c2.column_name='entity_id'
    LOOP
      EXECUTE format($f$DELETE FROM public.%I WHERE entity_type='property' AND entity_id::uuid = ANY($1)$f$, r.table_name)
        USING v_property_ids;
    END LOOP;

    DELETE FROM co_listing_requests WHERE existing_property_id = ANY(v_property_ids);
    DELETE FROM colisting_reports   WHERE property_ids && v_property_ids;
    DELETE FROM properties          WHERE id = ANY(v_property_ids);
  END IF;

  DELETE FROM agency_provisioning_audit WHERE agency_id = v_agency_id;
  DELETE FROM agency_provisioning_notes WHERE agency_id = v_agency_id;
  DELETE FROM agency_source_blocklist   WHERE agency_id = v_agency_id;
  DELETE FROM agency_sources            WHERE agency_id = v_agency_id;
  DELETE FROM agency_announcements      WHERE agency_id = v_agency_id;
  DELETE FROM agency_notifications      WHERE agency_id = v_agency_id;
  DELETE FROM agency_invites            WHERE agency_id = v_agency_id;
  DELETE FROM agency_join_requests      WHERE agency_id = v_agency_id;
  DELETE FROM agency_testimonials       WHERE agency_id = v_agency_id;

  DELETE FROM import_job_items WHERE job_id IN (SELECT id FROM import_jobs WHERE agency_id = v_agency_id);
  DELETE FROM import_jobs      WHERE agency_id = v_agency_id;

  IF v_agent_ids IS NOT NULL AND array_length(v_agent_ids,1) > 0 THEN
    DELETE FROM agent_notifications WHERE agent_id = ANY(v_agent_ids);
    DELETE FROM agents              WHERE id = ANY(v_agent_ids);
  END IF;

  UPDATE agencies
  SET handover_completed_at   = NULL,
      provisioned_at          = NULL,
      last_sync_at            = NULL,
      last_conflict_digest_at = NULL,
      management_status       = 'provisioning'
  WHERE id = v_agency_id;
END $$;
