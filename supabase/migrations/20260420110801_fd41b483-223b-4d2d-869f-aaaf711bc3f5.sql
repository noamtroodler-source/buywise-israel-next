-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 1: Data model foundation (adjusted: no properties.agency_id)
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. primary_agency_id column (NEW canonical owning-agency reference)
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS primary_agency_id UUID REFERENCES public.agencies(id);

-- Backfill from the agent's current agency
UPDATE public.properties p
SET primary_agency_id = a.agency_id
FROM public.agents a
WHERE p.primary_agency_id IS NULL
  AND p.agent_id = a.id
  AND a.agency_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_primary_agency_id
  ON public.properties(primary_agency_id);

-- 2. Boost tracking columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS boost_active_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS boosted_by_agency_id UUID REFERENCES public.agencies(id),
  ADD COLUMN IF NOT EXISTS last_primary_refresh TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_properties_boost_active
  ON public.properties(boost_active_until)
  WHERE boost_active_until IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_properties_last_primary_refresh
  ON public.properties(last_primary_refresh)
  WHERE last_primary_refresh IS NOT NULL;

UPDATE public.properties
SET last_primary_refresh = COALESCE(updated_at, created_at, now())
WHERE last_primary_refresh IS NULL;

-- 3. primary_agency_history
CREATE TABLE IF NOT EXISTS public.primary_agency_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  previous_agency_id UUID REFERENCES public.agencies(id),
  new_agency_id UUID NOT NULL REFERENCES public.agencies(id),
  reason TEXT NOT NULL CHECK (reason IN (
    'first_import',
    'manual_upgrade',
    'boost_start',
    'boost_end',
    'admin_override',
    'agency_churn',
    'stale_demotion',
    'dispute_resolution',
    'legacy_migration'
  )),
  actor_user_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_primary_agency_history_property
  ON public.primary_agency_history(property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_primary_agency_history_new_agency
  ON public.primary_agency_history(new_agency_id, created_at DESC);

INSERT INTO public.primary_agency_history (property_id, previous_agency_id, new_agency_id, reason, created_at)
SELECT id, NULL, primary_agency_id, 'legacy_migration', COALESCE(created_at, now())
FROM public.properties
WHERE primary_agency_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.primary_agency_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies read own property history" ON public.primary_agency_history;
CREATE POLICY "Agencies read own property history"
  ON public.primary_agency_history
  FOR SELECT
  USING (
    new_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR previous_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.property_co_agents pca
      JOIN public.agencies a ON a.id = pca.agency_id
      WHERE pca.property_id = primary_agency_history.property_id
        AND a.admin_user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins write history" ON public.primary_agency_history;
CREATE POLICY "Admins write history"
  ON public.primary_agency_history
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. primary_disputes
CREATE TABLE IF NOT EXISTS public.primary_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  disputing_agency_id UUID NOT NULL REFERENCES public.agencies(id),
  target_agency_id UUID NOT NULL REFERENCES public.agencies(id),
  reason TEXT,
  evidence_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'resolved_uphold',
    'resolved_dismiss',
    'withdrawn'
  )),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_primary_disputes_property
  ON public.primary_disputes(property_id);

CREATE INDEX IF NOT EXISTS idx_primary_disputes_status
  ON public.primary_disputes(status, created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.primary_disputes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Agencies read own disputes" ON public.primary_disputes;
CREATE POLICY "Agencies read own disputes"
  ON public.primary_disputes
  FOR SELECT
  USING (
    disputing_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR target_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Admins update disputes" ON public.primary_disputes;
CREATE POLICY "Admins update disputes"
  ON public.primary_disputes
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 5. merge_events
CREATE TABLE IF NOT EXISTS public.merge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  loser_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  merged_by UUID REFERENCES auth.users(id),
  loser_snapshot JSONB NOT NULL,
  unmerge_deadline TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  unmerged_at TIMESTAMPTZ,
  unmerged_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_merge_events_winner
  ON public.merge_events(winner_property_id);

CREATE INDEX IF NOT EXISTS idx_merge_events_deadline
  ON public.merge_events(unmerge_deadline)
  WHERE unmerged_at IS NULL;

ALTER TABLE public.merge_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read merge events" ON public.merge_events;
CREATE POLICY "Admins read merge events"
  ON public.merge_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins unmerge" ON public.merge_events;
CREATE POLICY "Admins unmerge"
  ON public.merge_events
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 6. property_co_agents RLS
DROP POLICY IF EXISTS "Public reads co-agents on published properties" ON public.property_co_agents;
CREATE POLICY "Public reads co-agents on published properties"
  ON public.property_co_agents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_co_agents.property_id
        AND p.is_published = true
    )
  );

DROP POLICY IF EXISTS "Agencies insert own co-agent rows" ON public.property_co_agents;
CREATE POLICY "Agencies insert own co-agent rows"
  ON public.property_co_agents
  FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

DROP POLICY IF EXISTS "Agencies delete own co-agent rows" ON public.property_co_agents;
CREATE POLICY "Agencies delete own co-agent rows"
  ON public.property_co_agents
  FOR DELETE
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- 7. log_primary_transition helper
CREATE OR REPLACE FUNCTION public.log_primary_transition(
  p_property_id UUID,
  p_new_agency_id UUID,
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_previous_agency_id UUID;
  v_history_id UUID;
BEGIN
  SELECT primary_agency_id INTO v_previous_agency_id
  FROM public.properties
  WHERE id = p_property_id;

  UPDATE public.properties
  SET primary_agency_id = p_new_agency_id,
      last_primary_refresh = now(),
      updated_at = now()
  WHERE id = p_property_id;

  INSERT INTO public.primary_agency_history (
    property_id, previous_agency_id, new_agency_id, reason, actor_user_id, notes
  ) VALUES (
    p_property_id, v_previous_agency_id, p_new_agency_id, p_reason, auth.uid(), p_notes
  ) RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- Phase 2: Scraper supporting schema
-- ═══════════════════════════════════════════════════════════════════════════

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

CREATE INDEX IF NOT EXISTS idx_properties_stale_scrape
  ON public.properties(last_primary_refresh)
  WHERE is_published = true AND added_manually = false;

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
    SELECT MAX(created_at) INTO v_last_transition
    FROM public.primary_agency_history
    WHERE primary_agency_history.property_id = r.id;
    IF v_last_transition IS NOT NULL
       AND v_last_transition > now() - (p_cooldown_days || ' days')::interval
    THEN
      CONTINUE;
    END IF;

    SELECT pca.agency_id, pca.agent_id
    INTO v_new_primary_agency, v_new_primary_agent
    FROM public.property_co_agents pca
    WHERE pca.property_id = r.id
      AND pca.agency_id IS NOT NULL
      AND pca.agency_id <> r.primary_agency_id
    ORDER BY pca.added_at DESC
    LIMIT 1;

    IF v_new_primary_agency IS NULL THEN
      CONTINUE;
    END IF;

    INSERT INTO public.property_co_agents (property_id, agent_id, agency_id, source_url, source_type)
    SELECT r.id, r.agent_id, r.primary_agency_id,
           COALESCE((SELECT source_url FROM public.properties WHERE id = r.id), 'unknown'),
           'website'
    WHERE r.primary_agency_id IS NOT NULL
    ON CONFLICT (property_id, source_url) DO NOTHING;

    DELETE FROM public.property_co_agents
    WHERE property_co_agents.property_id = r.id
      AND property_co_agents.agency_id = v_new_primary_agency;

    PERFORM public.log_primary_transition(
      r.id,
      v_new_primary_agency,
      'stale_demotion',
      'Stale scrape-only primary (no refresh in ' || p_stale_days || ' days); promoted most-recent secondary.'
    );

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