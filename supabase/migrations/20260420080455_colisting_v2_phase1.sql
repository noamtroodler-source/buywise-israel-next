-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 1: Data model foundation
-- ═══════════════════════════════════════════════════════════════════════════
--
-- Adds primary-agency formalization, history audit, dispute queue, boost
-- tracking columns, and a merge-events audit trail for reversible merges.
-- No behavior change yet — scraper/UI changes come in later phases.
--
-- Safe to run against live data: all additions, no drops.

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Add primary_agency_id as a non-breaking alias of agency_id
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS primary_agency_id UUID REFERENCES public.agencies(id);

-- Backfill primary_agency_id from existing agency_id
UPDATE public.properties
SET primary_agency_id = agency_id
WHERE primary_agency_id IS NULL AND agency_id IS NOT NULL;

-- Keep the two in sync going forward so nothing breaks while callers migrate.
-- The next phase (when UI/scraper start using primary_agency_id directly) will
-- retire this trigger and eventually drop agency_id.
CREATE OR REPLACE FUNCTION public.sync_primary_agency_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- On INSERT or UPDATE where one is set and the other isn't, fill the gap.
  IF NEW.agency_id IS NOT NULL AND NEW.primary_agency_id IS NULL THEN
    NEW.primary_agency_id := NEW.agency_id;
  ELSIF NEW.primary_agency_id IS NOT NULL AND NEW.agency_id IS NULL THEN
    NEW.agency_id := NEW.primary_agency_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS properties_sync_primary_agency_id ON public.properties;
CREATE TRIGGER properties_sync_primary_agency_id
  BEFORE INSERT OR UPDATE OF agency_id, primary_agency_id ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_primary_agency_id();

CREATE INDEX IF NOT EXISTS idx_properties_primary_agency_id
  ON public.properties(primary_agency_id);

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Boost tracking columns
-- ───────────────────────────────────────────────────────────────────────────

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

-- Seed last_primary_refresh for existing properties so the stale-sweep in
-- Phase 2 has a baseline and doesn't immediately demote everyone.
UPDATE public.properties
SET last_primary_refresh = COALESCE(updated_at, created_at, now())
WHERE last_primary_refresh IS NULL;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. primary_agency_history — audit log for every primary transition
-- ───────────────────────────────────────────────────────────────────────────

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

-- Seed one row per existing property so history is complete
INSERT INTO public.primary_agency_history (property_id, previous_agency_id, new_agency_id, reason, created_at)
SELECT id, NULL, primary_agency_id, 'legacy_migration', COALESCE(created_at, now())
FROM public.properties
WHERE primary_agency_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE public.primary_agency_history ENABLE ROW LEVEL SECURITY;

-- Agencies can see history rows for properties they're involved in (primary or co-agent)
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

-- Only service role or admins write to history (trigger-driven in later phases)
CREATE POLICY "Admins write history"
  ON public.primary_agency_history
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ───────────────────────────────────────────────────────────────────────────
-- 4. primary_disputes — lightweight successor to cross_agency_conflicts
-- ───────────────────────────────────────────────────────────────────────────

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

CREATE POLICY "Agencies read own disputes"
  ON public.primary_disputes
  FOR SELECT
  USING (
    disputing_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR target_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Agencies file disputes"
  ON public.primary_disputes
  FOR INSERT
  WITH CHECK (
    disputing_agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
  );

CREATE POLICY "Admins resolve disputes"
  ON public.primary_disputes
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ───────────────────────────────────────────────────────────────────────────
-- 5. merge_events — reversibility for merge_properties()
-- ───────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.merge_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  loser_property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  merged_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  merged_by UUID REFERENCES auth.users(id),
  -- Snapshot of loser's key fields BEFORE merge so we can restore
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

CREATE POLICY "Admins read merge events"
  ON public.merge_events
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins unmerge"
  ON public.merge_events
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ───────────────────────────────────────────────────────────────────────────
-- 6. property_co_agents RLS — secondary agencies read their own rows
-- ───────────────────────────────────────────────────────────────────────────
-- (Table already exists from a prior migration; just ensure the policies
--  support the new co-listing reads.)

-- Anonymous buyers + authenticated users can read co-agents on published properties
-- (needed so the buyer UI can render "also listed by" on any property card)
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

-- Agencies can insert their own co-agent row (when they match an existing property)
DROP POLICY IF EXISTS "Agencies insert own co-agent rows" ON public.property_co_agents;
CREATE POLICY "Agencies insert own co-agent rows"
  ON public.property_co_agents
  FOR INSERT
  WITH CHECK (
    agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- Agencies can delete their own co-agent row (step back from a co-listing)
DROP POLICY IF EXISTS "Agencies delete own co-agent rows" ON public.property_co_agents;
CREATE POLICY "Agencies delete own co-agent rows"
  ON public.property_co_agents
  FOR DELETE
  USING (
    agency_id IN (SELECT id FROM public.agencies WHERE admin_user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

-- ───────────────────────────────────────────────────────────────────────────
-- 7. log_primary_transition — helper RPC for Phase 2+ scraper and wizard
-- ───────────────────────────────────────────────────────────────────────────

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
  -- Snapshot current primary before update
  SELECT primary_agency_id INTO v_previous_agency_id
  FROM public.properties
  WHERE id = p_property_id;

  -- Update property
  UPDATE public.properties
  SET primary_agency_id = p_new_agency_id,
      agency_id = p_new_agency_id,
      last_primary_refresh = now(),
      updated_at = now()
  WHERE id = p_property_id;

  -- Log transition
  INSERT INTO public.primary_agency_history (
    property_id, previous_agency_id, new_agency_id, reason, actor_user_id, notes
  ) VALUES (
    p_property_id, v_previous_agency_id, p_new_agency_id, p_reason, auth.uid(), p_notes
  ) RETURNING id INTO v_history_id;

  RETURN v_history_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 1 migration
-- ───────────────────────────────────────────────────────────────────────────
