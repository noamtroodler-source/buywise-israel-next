-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 10: Telemetry + archive
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Final phase:
--   - get_colisting_telemetry() returns a single JSON blob of every co-listing
--     health metric the admin dashboard cares about. One RPC, one round-trip.
--   - cross_agency_conflicts is marked archive (insert-blocked) since all new
--     writes go to primary_disputes + property_co_agents.

-- ───────────────────────────────────────────────────────────────────────────
-- get_colisting_telemetry — single-shot metrics for the admin dashboard
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_colisting_telemetry()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN;
  v_published_count INT;
  v_with_co_agents INT;
  v_transitions_7d JSONB;
  v_disputes_30d INT;
  v_disputes_open INT;
  v_disputes_by_status JSONB;
  v_stale_sweeps_30d INT;
  v_boosts_30d INT;
  v_boosts_active INT;
  v_reports_open INT;
  v_reports_30d INT;
  v_avg_primary_per_agency NUMERIC;
  v_avg_coagent_per_agency NUMERIC;
BEGIN
  -- AuthZ — this function surfaces admin-only metrics.
  SELECT public.has_role(auth.uid(), 'admin'::app_role) INTO v_is_admin;
  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'Admin role required';
  END IF;

  -- Co-listing coverage (how many published properties have ≥1 secondary)
  SELECT COUNT(*) INTO v_published_count FROM public.properties WHERE is_published = true;
  SELECT COUNT(DISTINCT pca.property_id) INTO v_with_co_agents
  FROM public.property_co_agents pca
  JOIN public.properties p ON p.id = pca.property_id
  WHERE p.is_published = true;

  -- Primary transitions in the last 7 days, grouped by reason
  SELECT COALESCE(jsonb_object_agg(reason, c), '{}'::jsonb) INTO v_transitions_7d
  FROM (
    SELECT reason, COUNT(*) AS c
    FROM public.primary_agency_history
    WHERE created_at > now() - interval '7 days'
    GROUP BY reason
  ) t;

  -- Disputes: open now + filed in last 30d + resolution breakdown
  SELECT COUNT(*) INTO v_disputes_open FROM public.primary_disputes WHERE status = 'pending';
  SELECT COUNT(*) INTO v_disputes_30d
  FROM public.primary_disputes
  WHERE created_at > now() - interval '30 days';

  SELECT COALESCE(jsonb_object_agg(status, c), '{}'::jsonb) INTO v_disputes_by_status
  FROM (
    SELECT status, COUNT(*) AS c
    FROM public.primary_disputes
    WHERE created_at > now() - interval '30 days'
    GROUP BY status
  ) t;

  -- Stale demotions in last 30 days (health of scraper freshness)
  SELECT COUNT(*) INTO v_stale_sweeps_30d
  FROM public.primary_agency_history
  WHERE reason = 'stale_demotion'
    AND created_at > now() - interval '30 days';

  -- Boosts
  SELECT COUNT(*) INTO v_boosts_active
  FROM public.properties
  WHERE boost_active_until IS NOT NULL
    AND boost_active_until > now()
    AND boosted_by_agency_id IS NOT NULL;

  SELECT COUNT(*) INTO v_boosts_30d
  FROM public.primary_agency_history
  WHERE reason = 'boost_start'
    AND created_at > now() - interval '30 days';

  -- Cluster reports
  SELECT COUNT(*) INTO v_reports_open FROM public.colisting_reports WHERE status = 'pending';
  SELECT COUNT(*) INTO v_reports_30d
  FROM public.colisting_reports
  WHERE created_at > now() - interval '30 days';

  -- Per-agency inventory averages (only considers agencies with ≥1 listing)
  SELECT COALESCE(AVG(cnt), 0) INTO v_avg_primary_per_agency
  FROM (
    SELECT primary_agency_id, COUNT(*) AS cnt
    FROM public.properties
    WHERE primary_agency_id IS NOT NULL AND is_published = true
    GROUP BY primary_agency_id
  ) t;

  SELECT COALESCE(AVG(cnt), 0) INTO v_avg_coagent_per_agency
  FROM (
    SELECT agency_id, COUNT(*) AS cnt
    FROM public.property_co_agents
    WHERE agency_id IS NOT NULL
    GROUP BY agency_id
  ) t;

  RETURN jsonb_build_object(
    'coverage', jsonb_build_object(
      'published_properties', v_published_count,
      'with_co_agents',       v_with_co_agents,
      'coverage_pct',         CASE WHEN v_published_count > 0
                                   THEN ROUND(100.0 * v_with_co_agents / v_published_count, 1)
                                   ELSE 0 END
    ),
    'transitions_7d',      v_transitions_7d,
    'disputes', jsonb_build_object(
      'open_now',            v_disputes_open,
      'filed_30d',           v_disputes_30d,
      'by_status_30d',       v_disputes_by_status
    ),
    'stale_demotions_30d', v_stale_sweeps_30d,
    'boosts', jsonb_build_object(
      'active_now',          v_boosts_active,
      'activations_30d',     v_boosts_30d
    ),
    'reports', jsonb_build_object(
      'open_now',            v_reports_open,
      'filed_30d',           v_reports_30d
    ),
    'per_agency', jsonb_build_object(
      'avg_primary_listings', ROUND(v_avg_primary_per_agency, 1),
      'avg_co_agent_rows',    ROUND(v_avg_coagent_per_agency, 1)
    ),
    'generated_at', now()
  );
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- cross_agency_conflicts — mark archive (prevent new writes)
-- ───────────────────────────────────────────────────────────────────────────
--
-- All new conflict handling flows through primary_disputes + property_co_agents
-- (Phases 1/2/4/6). The legacy cross_agency_conflicts data is kept for audit
-- but a BEFORE INSERT trigger now blocks new rows so no code accidentally
-- resurrects the old model.

CREATE OR REPLACE FUNCTION public.block_cross_agency_conflicts_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'cross_agency_conflicts is archived — use primary_disputes + property_co_agents instead (Co-Listing v2)';
END;
$$;

DROP TRIGGER IF EXISTS block_cross_agency_conflicts_insert_trigger ON public.cross_agency_conflicts;
CREATE TRIGGER block_cross_agency_conflicts_insert_trigger
  BEFORE INSERT ON public.cross_agency_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION public.block_cross_agency_conflicts_insert();

-- Add a helpful comment
COMMENT ON TABLE public.cross_agency_conflicts IS
  'ARCHIVED (Co-Listing v2 Phase 10). New conflicts use primary_disputes + property_co_agents. Historical data retained read-only.';

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 10 migration — Co-Listing v2 complete
-- ───────────────────────────────────────────────────────────────────────────
