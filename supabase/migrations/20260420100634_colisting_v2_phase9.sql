-- ═══════════════════════════════════════════════════════════════════════════
-- Co-Listing v2 — Phase 9: Buyer report-wrong-cluster
-- ═══════════════════════════════════════════════════════════════════════════
--
-- When the algorithm mis-links two different units as one co-listing,
-- buyers can flag it from the "Also listed by" block on the property page.
-- Reports land in colisting_reports for admin review.
--
-- Anyone (including unauthenticated buyers) can submit a report; admins
-- can see and resolve them.

CREATE TABLE IF NOT EXISTS public.colisting_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  /** Optional — the specific secondary agency the buyer thinks is wrong.
      NULL when the buyer just says "these aren't the same". */
  reported_co_agent_id UUID REFERENCES public.property_co_agents(id) ON DELETE SET NULL,
  /** Short, free-text buyer reason. Optional. */
  reason TEXT,
  reporter_user_id UUID REFERENCES auth.users(id),
  reporter_email TEXT,
  /** Triage status. Admins move items out of 'pending'. */
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'accepted', 'dismissed'
  )),
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_colisting_reports_property
  ON public.colisting_reports(property_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_colisting_reports_status
  ON public.colisting_reports(status, created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.colisting_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can file a report (including anonymous buyers)
CREATE POLICY "Public files cluster reports"
  ON public.colisting_reports
  FOR INSERT
  WITH CHECK (true);

-- Admins read + update all reports
CREATE POLICY "Admins read cluster reports"
  ON public.colisting_reports
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins resolve cluster reports"
  ON public.colisting_reports
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ───────────────────────────────────────────────────────────────────────────
-- file_colisting_report — convenience RPC used by the buyer UI
-- ───────────────────────────────────────────────────────────────────────────
--
-- Wraps the INSERT so the client can pass a single `reporter_email` and
-- we'll capture auth.uid() when available. Soft rate-limit: one pending
-- report per (user/email, property) per 24h.

CREATE OR REPLACE FUNCTION public.file_colisting_report(
  p_property_id UUID,
  p_reported_co_agent_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_reporter_email TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_existing UUID;
  v_new_id UUID;
BEGIN
  -- Soft rate-limit: reject if this reporter already has a pending report
  -- against this property in the last 24 hours.
  IF v_user_id IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.colisting_reports
    WHERE property_id = p_property_id
      AND reporter_user_id = v_user_id
      AND status = 'pending'
      AND created_at > now() - interval '1 day'
    LIMIT 1;
  ELSIF p_reporter_email IS NOT NULL THEN
    SELECT id INTO v_existing
    FROM public.colisting_reports
    WHERE property_id = p_property_id
      AND reporter_email = lower(p_reporter_email)
      AND status = 'pending'
      AND created_at > now() - interval '1 day'
    LIMIT 1;
  END IF;

  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  INSERT INTO public.colisting_reports (
    property_id, reported_co_agent_id, reason,
    reporter_user_id, reporter_email
  ) VALUES (
    p_property_id, p_reported_co_agent_id, NULLIF(trim(p_reason), ''),
    v_user_id, lower(NULLIF(trim(p_reporter_email), ''))
  ) RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- End of Phase 9 migration
-- ───────────────────────────────────────────────────────────────────────────
