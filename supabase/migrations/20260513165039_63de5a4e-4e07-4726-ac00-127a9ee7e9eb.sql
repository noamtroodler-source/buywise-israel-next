
DO $$
DECLARE
  jre_id uuid := '0058c3aa-2331-4a34-9c0e-c11aa984deff';
  prop_ids uuid[];
BEGIN
  SELECT array_agg(id) INTO prop_ids
  FROM public.properties
  WHERE primary_agency_id = jre_id OR claimed_by_agency_id = jre_id;

  IF prop_ids IS NULL OR array_length(prop_ids, 1) = 0 THEN
    RAISE NOTICE 'No JRE properties to delete';
    RETURN;
  END IF;

  BEGIN DELETE FROM public.co_listings WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.cross_agency_conflicts WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.cross_agency_conflicts WHERE primary_property_id = ANY(prop_ids) OR duplicate_property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.conflicts_log WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.import_job_items WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.image_overlap_reviews WHERE property_id = ANY(prop_ids) OR other_property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.property_price_history WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.property_views WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.favorites WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.inquiries WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.featured_listings WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.property_questions WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.merge_history WHERE property_id = ANY(prop_ids) OR merged_into_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.property_impressions WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.recently_viewed WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.listing_reports WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;
  BEGIN DELETE FROM public.appeal_conflicts WHERE property_id = ANY(prop_ids); EXCEPTION WHEN undefined_table OR undefined_column THEN NULL; END;

  DELETE FROM public.properties WHERE id = ANY(prop_ids);

  RAISE NOTICE 'Deleted % JRE properties', array_length(prop_ids, 1);
END $$;
