-- ============================================================================
-- Phase 8 — Telemetry RPC + lock down legacy cross_agency_conflicts inserts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_colisting_telemetry()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Admin access required' USING ERRCODE = '42501';
  END IF;

  v_result := jsonb_build_object(
    'generated_at', now(),

    'properties', (
      SELECT jsonb_build_object(
        'total_published', COUNT(*) FILTER (WHERE is_published),
        'with_primary',    COUNT(*) FILTER (WHERE primary_agency_id IS NOT NULL AND is_published),
        'orphan_no_primary', COUNT(*) FILTER (WHERE primary_agency_id IS NULL AND is_published),
        'with_co_agents',  COUNT(DISTINCT pca.property_id)
      )
      FROM public.properties p
      LEFT JOIN public.property_co_agents pca ON pca.property_id = p.id
    ),

    'boosts', (
      SELECT jsonb_build_object(
        'active',         COUNT(*) FILTER (WHERE boost_active_until > now()),
        'expiring_3d',    COUNT(*) FILTER (WHERE boost_active_until BETWEEN now() AND now() + interval '3 days'),
        'expiring_24h',   COUNT(*) FILTER (WHERE boost_active_until BETWEEN now() AND now() + interval '24 hours')
      )
      FROM public.properties WHERE boost_active_until IS NOT NULL
    ),

    'disputes', (
      SELECT jsonb_build_object(
        'pending',  COUNT(*) FILTER (WHERE status = 'pending'),
        'reviewing',COUNT(*) FILTER (WHERE status = 'reviewing'),
        'upheld',   COUNT(*) FILTER (WHERE status = 'upheld'),
        'rejected', COUNT(*) FILTER (WHERE status = 'rejected'),
        'last_30d', COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')
      )
      FROM public.primary_disputes
    ),

    'transitions_last_30d', (
      SELECT jsonb_object_agg(reason, cnt)
      FROM (
        SELECT reason, COUNT(*) AS cnt
        FROM public.primary_agency_history
        WHERE transitioned_at > now() - interval '30 days'
        GROUP BY reason
      ) t
    ),

    'top_boosting_agencies_30d', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'agency_id', agency_id,
        'agency_name', agency_name,
        'boosts',     boosts
      )), '[]'::jsonb)
      FROM (
        SELECT a.id AS agency_id, a.name AS agency_name, COUNT(*) AS boosts
        FROM public.primary_agency_history h
        JOIN public.agencies a ON a.id = h.to_agency_id
        WHERE h.reason = 'boost_start'
          AND h.transitioned_at > now() - interval '30 days'
        GROUP BY a.id, a.name
        ORDER BY boosts DESC
        LIMIT 10
      ) t
    ),

    'stale_scrape_candidates', (
      SELECT COUNT(*)::int
      FROM public.properties
      WHERE primary_agency_id IS NOT NULL
        AND import_source IS NOT NULL
        AND import_source <> 'manual'
        AND COALESCE(last_primary_refresh, updated_at) < now() - interval '60 days'
    ),

    'reports', (
      SELECT jsonb_build_object(
        'pending',                       COUNT(*) FILTER (WHERE status = 'pending'),
        'reviewing',                     COUNT(*) FILTER (WHERE status = 'reviewing'),
        'confirmed_different_units',     COUNT(*) FILTER (WHERE status = 'confirmed_different_units'),
        'confirmed_same_unit',           COUNT(*) FILTER (WHERE status = 'confirmed_same_unit'),
        'dismissed',                     COUNT(*) FILTER (WHERE status = 'dismissed')
      )
      FROM public.colisting_reports
    )
  );

  RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- Lock down legacy cross_agency_conflicts inserts (read still allowed)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.block_cross_agency_conflicts_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'cross_agency_conflicts is archived. Use the Co-Listing v2 flow (primary_disputes / colist_as_secondary).'
    USING ERRCODE = 'P0001';
END;
$$;

DROP TRIGGER IF EXISTS trg_block_cross_agency_conflicts_insert ON public.cross_agency_conflicts;
CREATE TRIGGER trg_block_cross_agency_conflicts_insert
BEFORE INSERT ON public.cross_agency_conflicts
FOR EACH ROW EXECUTE FUNCTION public.block_cross_agency_conflicts_insert();