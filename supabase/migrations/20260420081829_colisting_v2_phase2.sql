-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 2: Scraper supporting schema
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Adds the 'co_listed' status to import_job_items so scraper runs can mark
-- items that were linked as secondary co-agents (distinct from 'skipped',
-- which implies a failure). Adds an index to speed up the stale-scrape
-- sweep in later phases.

-- ── Widen import_job_items.status CHECK constraint to include 'co_listed' ──

DO $$
BEGIN
  ALTER TABLE public.import_job_items
    DROP CONSTRAINT IF EXISTS import_job_items_status_check;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

ALTER TABLE public.import_job_items
  ADD CONSTRAINT import_job_items_status_check
  CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped', 'co_listed'));

-- ── Index for stale-scrape sweep ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_properties_stale_scrape
  ON public.properties(last_primary_refresh)
  WHERE is_published = true AND added_manually = false;

-- ── colisting_stale_sweep() ─────────────────────────────────────────────────
--
-- Nightly maintenance: demote stale scrape-only primaries and promote the most
-- recently refreshed secondary in their place. Properties with no secondary to
-- promote are left alone (they'll be handled by a separate unpublish sweep
-- in a later phase).
--
-- Cooldown: a property whose primary changed in the last 7 days is not
-- re-evaluated, to prevent ping-pong when a flaky site intermittently
-- loses/regains a listing.

CREATE OR REPLACE FUNCTION public.colisting_stale_sweep(
  p_stale_days INT DEFAULT 60,
  p_cooldown_days INT DEFAULT 7
)
RETURNS TABLE (property_id UUID, previous_agency_id UUID, new_agency_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_new_primary_agency UUID;
  v_new_primary_agent UUID;
  v_last_transition TIMESTAMPTZ;
BEGIN
  FOR r IN
    SELECT p.id, p.primary_agency_id, p.agent_id
    FROM public.properties p
    WHERE p.is_published = true
      AND COALESCE(p.added_manually, false) = false
      AND p.last_primary_refresh IS NOT NULL
      AND p.last_primary_refresh < now() - (p_stale_days || ' days')::interval
  LOOP
    -- Cooldown check — skip if primary changed recently
    SELECT MAX(created_at) INTO v_last_transition
    FROM public.primary_agency_history
    WHERE primary_agency_history.property_id = r.id;
    IF v_last_transition IS NOT NULL
       AND v_last_transition > now() - (p_cooldown_days || ' days')::interval
    THEN
      CONTINUE;
    END IF;

    -- Pick the most recently added co-agent (exclude the current primary)
    SELECT pca.agency_id, pca.agent_id
    INTO v_new_primary_agency, v_new_primary_agent
    FROM public.property_co_agents pca
    WHERE pca.property_id = r.id
      AND pca.agency_id IS NOT NULL
      AND pca.agency_id <> r.primary_agency_id
    ORDER BY pca.added_at DESC
    LIMIT 1;

    -- No secondary available — leave alone for now
    IF v_new_primary_agency IS NULL THEN
      CONTINUE;
    END IF;

    -- Promote the secondary to primary. Move the old primary into co_agents
    -- (best-effort; UNIQUE(property_id, source_url) may skip if already present).
    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT r.id, r.agent_id, r.primary_agency_id,
           COALESCE((SELECT source_url FROM public.properties WHERE id = r.id), 'unknown'),
           'website'
    WHERE r.primary_agency_id IS NOT NULL
    ON CONFLICT (property_id, source_url) DO NOTHING;

    -- Remove the new primary's co-agent row (they're now primary, not secondary)
    DELETE FROM public.property_co_agents
    WHERE property_co_agents.property_id = r.id
      AND property_co_agents.agency_id = v_new_primary_agency;

    -- Apply the primary change + history log via the helper
    PERFORM public.log_primary_transition(
      r.id,
      v_new_primary_agency,
      'stale_demotion',
      'Stale scrape-only primary (no refresh in ' || p_stale_days || ' days); promoted most-recent secondary.'
    );

    -- Reassign agent if we have one
    IF v_new_primary_agent IS NOT NULL THEN
      UPDATE public.properties SET agent_id = v_new_primary_agent WHERE id = r.id;
    END IF;

    property_id := r.id;
    previous_agency_id := r.primary_agency_id;
    new_agency_id := v_new_primary_agency;
    RETURN NEXT;
  END LOOP;
END;
$$;
