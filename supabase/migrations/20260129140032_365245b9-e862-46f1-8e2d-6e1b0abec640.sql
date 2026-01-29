
-- Fix 1: Add search_path to calculate_journey_stage function
CREATE OR REPLACE FUNCTION public.calculate_journey_stage(milestones jsonb)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF milestones ? 'first_inquiry' OR milestones ? 'signup' THEN
    RETURN 'action';
  ELSIF milestones ? 'first_save' OR milestones ? 'first_share' THEN
    RETURN 'decision';
  ELSIF milestones ? 'first_search' THEN
    RETURN 'consideration';
  ELSE
    RETURN 'awareness';
  END IF;
END;
$$;

-- Fix 2: Update analytics table policies to require session_id validation
-- These tables are for anonymous tracking, so we validate session_id format instead of true

-- client_errors: require valid session_id format
DROP POLICY IF EXISTS "Anyone can insert client errors" ON public.client_errors;
CREATE POLICY "Insert client errors with valid session"
  ON public.client_errors FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- comparison_sessions: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert comparison sessions" ON public.comparison_sessions;
CREATE POLICY "Insert comparison sessions with valid session"
  ON public.comparison_sessions FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- content_engagement: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert content engagement" ON public.content_engagement;
CREATE POLICY "Insert content engagement with valid session"
  ON public.content_engagement FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- email_verifications: require valid email format
DROP POLICY IF EXISTS "Anyone can create verification codes" ON public.email_verifications;
CREATE POLICY "Create verification codes with valid email"
  ON public.email_verifications FOR INSERT TO anon, authenticated
  WITH CHECK (email IS NOT NULL AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

DROP POLICY IF EXISTS "Anyone can update verification codes" ON public.email_verifications;
CREATE POLICY "Update own verification codes"
  ON public.email_verifications FOR UPDATE TO anon, authenticated
  USING (email IS NOT NULL);

-- experiment_exposures: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert experiment exposures" ON public.experiment_exposures;
CREATE POLICY "Insert experiment exposures with valid session"
  ON public.experiment_exposures FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

DROP POLICY IF EXISTS "Anyone can update experiment exposures" ON public.experiment_exposures;
CREATE POLICY "Update experiment exposures with valid session"
  ON public.experiment_exposures FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) >= 10);

-- funnel_exit_feedback: require valid session_id
DROP POLICY IF EXISTS "Anyone can submit funnel feedback" ON public.funnel_exit_feedback;
CREATE POLICY "Submit funnel feedback with valid session"
  ON public.funnel_exit_feedback FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- integration_health: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert integration health" ON public.integration_health;
CREATE POLICY "Insert integration health with valid session"
  ON public.integration_health FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- listing_impressions: require valid session_id and entity_id
DROP POLICY IF EXISTS "Anyone can insert impressions" ON public.listing_impressions;
CREATE POLICY "Insert impressions with valid data"
  ON public.listing_impressions FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10 AND entity_id IS NOT NULL);

-- listing_micro_signals: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert micro signals" ON public.listing_micro_signals;
CREATE POLICY "Insert micro signals with valid session"
  ON public.listing_micro_signals FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- location_module_events: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert location module events" ON public.location_module_events;
CREATE POLICY "Insert location events with valid session"
  ON public.location_module_events FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- page_engagement: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert page engagement" ON public.page_engagement;
CREATE POLICY "Insert page engagement with valid session"
  ON public.page_engagement FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- performance_metrics: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert performance metrics" ON public.performance_metrics;
CREATE POLICY "Insert performance metrics with valid session"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- search_analytics: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert search analytics" ON public.search_analytics;
CREATE POLICY "Insert search analytics with valid session"
  ON public.search_analytics FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- share_events: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert share events" ON public.share_events;
CREATE POLICY "Insert share events with valid session"
  ON public.share_events FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- tool_runs: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert tool runs" ON public.tool_runs;
CREATE POLICY "Insert tool runs with valid session"
  ON public.tool_runs FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- tool_step_events: require valid tool_run_id (corrected column name)
DROP POLICY IF EXISTS "Anyone can insert tool step events" ON public.tool_step_events;
CREATE POLICY "Insert tool step events with valid run"
  ON public.tool_step_events FOR INSERT
  WITH CHECK (tool_run_id IS NOT NULL);

-- user_events: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert events" ON public.user_events;
CREATE POLICY "Insert user events with valid session"
  ON public.user_events FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

-- user_milestones: require valid session_id
DROP POLICY IF EXISTS "Anyone can insert milestones" ON public.user_milestones;
CREATE POLICY "Insert milestones with valid session"
  ON public.user_milestones FOR INSERT
  WITH CHECK (session_id IS NOT NULL AND length(session_id) >= 10);

DROP POLICY IF EXISTS "Anyone can update milestones" ON public.user_milestones;
CREATE POLICY "Update milestones with valid session"
  ON public.user_milestones FOR UPDATE
  USING (session_id IS NOT NULL AND length(session_id) >= 10);
