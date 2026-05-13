
DO $$
DECLARE
  jre_id uuid := '0058c3aa-2331-4a34-9c0e-c11aa984deff';
BEGIN
  BEGIN DELETE FROM public.agency_announcements WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_invites WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_join_requests WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_members WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_notifications WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_provisioning_audit WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_provisioning_notes WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_source_blocklist WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_sources WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agency_testimonials WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.agents WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.co_listing_requests WHERE existing_agency_id = jre_id OR requesting_agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.cross_agency_conflicts WHERE existing_agency_id = jre_id OR attempted_agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.featured_listings WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.featured_performance WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.founding_partners WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.import_conflicts WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.import_job_items WHERE job_id IN (SELECT id FROM public.import_jobs WHERE agency_id = jre_id); EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.import_jobs WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.listing_agency_reviews WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.listing_claim_requests WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.listing_lifecycle WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.password_setup_tokens WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.primary_agency_history WHERE previous_agency_id = jre_id OR new_agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.primary_disputes WHERE target_agency_id = jre_id OR disputing_agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.property_co_agents WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.property_inquiries WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.property_source_observations WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.provisional_credentials WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;
  BEGIN DELETE FROM public.yad2_scrape_queue WHERE agency_id = jre_id; EXCEPTION WHEN undefined_table OR undefined_column OR feature_not_supported THEN NULL; END;

  DELETE FROM public.agencies WHERE id = jre_id;
END $$;
