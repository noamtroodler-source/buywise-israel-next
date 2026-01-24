-- =====================================================
-- COMPREHENSIVE ANALYTICS ENHANCEMENT - 15 NEW TABLES
-- =====================================================

-- 1. LISTING IMPRESSIONS (visibility tracking)
CREATE TABLE public.listing_impressions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project')),
  entity_id uuid NOT NULL,
  search_id uuid,
  session_id text NOT NULL,
  user_id uuid,
  position_in_results int,
  page_number int DEFAULT 1,
  sort_option text,
  filter_hash text,
  viewport_visible boolean DEFAULT false,
  time_visible_ms int,
  was_promoted boolean DEFAULT false,
  promotion_type text,
  card_variant text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_impressions_entity ON listing_impressions(entity_type, entity_id);
CREATE INDEX idx_listing_impressions_session ON listing_impressions(session_id);
CREATE INDEX idx_listing_impressions_created ON listing_impressions(created_at);

ALTER TABLE public.listing_impressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert impressions"
  ON public.listing_impressions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view impressions"
  ON public.listing_impressions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. PAGE ENGAGEMENT (active time, scroll depth)
CREATE TABLE public.page_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  page_path text NOT NULL,
  entity_type text,
  entity_id uuid,
  active_time_ms int DEFAULT 0,
  scroll_depth_max int DEFAULT 0 CHECK (scroll_depth_max >= 0 AND scroll_depth_max <= 100),
  interactions_count int DEFAULT 0,
  exit_type text CHECK (exit_type IN ('back', 'navigate', 'close', 'external')),
  engaged boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_engagement_session ON page_engagement(session_id);
CREATE INDEX idx_page_engagement_entity ON page_engagement(entity_type, entity_id);
CREATE INDEX idx_page_engagement_created ON page_engagement(created_at);

ALTER TABLE public.page_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page engagement"
  ON public.page_engagement FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view page engagement"
  ON public.page_engagement FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. LISTING PRICE HISTORY (full audit trail)
CREATE TABLE public.listing_price_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project')),
  entity_id uuid NOT NULL,
  old_price numeric NOT NULL,
  new_price numeric NOT NULL,
  change_percent numeric GENERATED ALWAYS AS (
    CASE WHEN old_price > 0 THEN ((new_price - old_price) / old_price * 100) ELSE 0 END
  ) STORED,
  changed_at timestamptz NOT NULL DEFAULT now(),
  change_reason text,
  changed_by_type text CHECK (changed_by_type IN ('agent', 'developer', 'admin', 'system')),
  changed_by_id uuid,
  index_adjustment_applied boolean DEFAULT false
);

CREATE INDEX idx_listing_price_history_entity ON listing_price_history(entity_type, entity_id);
CREATE INDEX idx_listing_price_history_changed ON listing_price_history(changed_at);

ALTER TABLE public.listing_price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage price history"
  ON public.listing_price_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their property price history"
  ON public.listing_price_history FOR SELECT
  USING (
    entity_type = 'property' AND 
    entity_id IN (SELECT id FROM properties WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  );

-- 4. LISTING STATUS HISTORY (full timeline)
CREATE TABLE public.listing_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project')),
  entity_id uuid NOT NULL,
  status_from text NOT NULL,
  status_to text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  changed_by_type text CHECK (changed_by_type IN ('agent', 'developer', 'admin', 'system', 'auto')),
  changed_by_id uuid,
  notes text
);

CREATE INDEX idx_listing_status_history_entity ON listing_status_history(entity_type, entity_id);
CREATE INDEX idx_listing_status_history_changed ON listing_status_history(changed_at);

ALTER TABLE public.listing_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage status history"
  ON public.listing_status_history FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their property status history"
  ON public.listing_status_history FOR SELECT
  USING (
    entity_type = 'property' AND 
    entity_id IN (SELECT id FROM properties WHERE agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()))
  );

-- 5. TOOL RUNS (calculator tracking)
CREATE TABLE public.tool_runs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  tool_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  completion_status text CHECK (completion_status IN ('completed', 'abandoned', 'error')),
  inputs_json jsonb DEFAULT '{}',
  outputs_summary_json jsonb,
  related_listing_id uuid,
  next_action text
);

CREATE INDEX idx_tool_runs_session ON tool_runs(session_id);
CREATE INDEX idx_tool_runs_tool ON tool_runs(tool_name);
CREATE INDEX idx_tool_runs_started ON tool_runs(started_at);

ALTER TABLE public.tool_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tool runs"
  ON public.tool_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own tool runs"
  ON public.tool_runs FOR UPDATE
  USING (session_id = session_id);

CREATE POLICY "Admins can view tool runs"
  ON public.tool_runs FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 6. TOOL STEP EVENTS
CREATE TABLE public.tool_step_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_run_id uuid NOT NULL REFERENCES tool_runs(id) ON DELETE CASCADE,
  step_name text NOT NULL,
  step_order int NOT NULL,
  entered_at timestamptz NOT NULL DEFAULT now(),
  exited_at timestamptz,
  abandoned boolean DEFAULT false,
  inputs_at_step jsonb
);

CREATE INDEX idx_tool_step_events_run ON tool_step_events(tool_run_id);

ALTER TABLE public.tool_step_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert tool step events"
  ON public.tool_step_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view tool step events"
  ON public.tool_step_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. LOCATION MODULE EVENTS
CREATE TABLE public.location_module_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  property_id uuid NOT NULL,
  event_type text NOT NULL,
  anchor_type text,
  travel_mode text,
  custom_place_type text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_location_module_events_property ON location_module_events(property_id);
CREATE INDEX idx_location_module_events_type ON location_module_events(event_type);
CREATE INDEX idx_location_module_events_created ON location_module_events(created_at);

ALTER TABLE public.location_module_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert location module events"
  ON public.location_module_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view location module events"
  ON public.location_module_events FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. LEAD RESPONSE EVENTS
CREATE TABLE public.lead_response_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inquiry_id uuid NOT NULL,
  inquiry_type text NOT NULL CHECK (inquiry_type IN ('property', 'project')),
  agent_id uuid,
  developer_id uuid,
  first_response_time_minutes int,
  response_type text CHECK (response_type IN ('call', 'whatsapp', 'email', 'sms')),
  response_length int,
  outcome text CHECK (outcome IN ('visit_scheduled', 'info_provided', 'closed_won', 'closed_lost', 'no_response')),
  loss_reason text,
  notes text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lead_response_events_inquiry ON lead_response_events(inquiry_id);
CREATE INDEX idx_lead_response_events_agent ON lead_response_events(agent_id);
CREATE INDEX idx_lead_response_events_created ON lead_response_events(created_at);

ALTER TABLE public.lead_response_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can manage their lead responses"
  ON public.lead_response_events FOR ALL
  USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Admins can manage all lead responses"
  ON public.lead_response_events FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. ADVERTISER QUALITY SNAPSHOTS
CREATE TABLE public.advertiser_quality_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  snapshot_date date NOT NULL,
  actor_type text NOT NULL CHECK (actor_type IN ('agent', 'developer', 'agency')),
  actor_id uuid NOT NULL,
  total_listings int DEFAULT 0,
  avg_photo_count numeric DEFAULT 0,
  pct_with_sqm numeric DEFAULT 0,
  pct_with_floor numeric DEFAULT 0,
  pct_with_parking numeric DEFAULT 0,
  pct_with_description numeric DEFAULT 0,
  avg_description_length int DEFAULT 0,
  verification_rate numeric DEFAULT 0,
  stale_listing_rate numeric DEFAULT 0,
  price_update_frequency numeric DEFAULT 0,
  response_rate numeric DEFAULT 0,
  avg_response_time_hours numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (snapshot_date, actor_type, actor_id)
);

CREATE INDEX idx_advertiser_quality_snapshots_date ON advertiser_quality_snapshots(snapshot_date);
CREATE INDEX idx_advertiser_quality_snapshots_actor ON advertiser_quality_snapshots(actor_type, actor_id);

ALTER TABLE public.advertiser_quality_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quality snapshots"
  ON public.advertiser_quality_snapshots FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Actors can view their own snapshots"
  ON public.advertiser_quality_snapshots FOR SELECT
  USING (
    (actor_type = 'agent' AND actor_id IN (SELECT id FROM agents WHERE user_id = auth.uid())) OR
    (actor_type = 'developer' AND actor_id IN (SELECT id FROM developers WHERE user_id = auth.uid()))
  );

-- 10. LISTING MICRO SIGNALS
CREATE TABLE public.listing_micro_signals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  entity_type text NOT NULL CHECK (entity_type IN ('property', 'project')),
  entity_id uuid NOT NULL,
  signal_type text NOT NULL,
  signal_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_listing_micro_signals_entity ON listing_micro_signals(entity_type, entity_id);
CREATE INDEX idx_listing_micro_signals_type ON listing_micro_signals(signal_type);
CREATE INDEX idx_listing_micro_signals_created ON listing_micro_signals(created_at);

ALTER TABLE public.listing_micro_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert micro signals"
  ON public.listing_micro_signals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view micro signals"
  ON public.listing_micro_signals FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 11. CONTENT ENGAGEMENT
CREATE TABLE public.content_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  content_type text NOT NULL CHECK (content_type IN ('blog_post', 'guide', 'glossary')),
  content_id uuid NOT NULL,
  completion_percent int DEFAULT 0 CHECK (completion_percent >= 0 AND completion_percent <= 100),
  scroll_depth_max int DEFAULT 0,
  active_time_ms int DEFAULT 0,
  next_action text,
  next_action_target text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_engagement_content ON content_engagement(content_type, content_id);
CREATE INDEX idx_content_engagement_created ON content_engagement(created_at);

ALTER TABLE public.content_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert content engagement"
  ON public.content_engagement FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view content engagement"
  ON public.content_engagement FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 12. USER MILESTONES
CREATE TABLE public.user_milestones (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  milestone text NOT NULL,
  first_reached_at timestamptz NOT NULL DEFAULT now(),
  reach_count int DEFAULT 1,
  metadata jsonb
);

CREATE INDEX idx_user_milestones_user ON user_milestones(user_id);
CREATE INDEX idx_user_milestones_milestone ON user_milestones(milestone);
CREATE INDEX idx_user_milestones_reached ON user_milestones(first_reached_at);
CREATE UNIQUE INDEX idx_user_milestones_unique ON user_milestones(COALESCE(user_id, '00000000-0000-0000-0000-000000000000'::uuid), session_id, milestone);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update milestones"
  ON public.user_milestones FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view milestones"
  ON public.user_milestones FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own milestones"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

-- 13. EXPERIMENT EXPOSURES
CREATE TABLE public.experiment_exposures (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  experiment_name text NOT NULL,
  variant text NOT NULL,
  component text,
  exposed_at timestamptz NOT NULL DEFAULT now(),
  converted boolean DEFAULT false,
  converted_at timestamptz
);

CREATE INDEX idx_experiment_exposures_experiment ON experiment_exposures(experiment_name);
CREATE INDEX idx_experiment_exposures_variant ON experiment_exposures(experiment_name, variant);
CREATE INDEX idx_experiment_exposures_exposed ON experiment_exposures(exposed_at);

ALTER TABLE public.experiment_exposures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert experiment exposures"
  ON public.experiment_exposures FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update experiment exposures"
  ON public.experiment_exposures FOR UPDATE
  USING (true);

CREATE POLICY "Admins can view experiment exposures"
  ON public.experiment_exposures FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 14. PERFORMANCE METRICS
CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  page_path text NOT NULL,
  route_load_time_ms int,
  lcp_ms int,
  cls numeric,
  inp_ms int,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_performance_metrics_page ON performance_metrics(page_path);
CREATE INDEX idx_performance_metrics_created ON performance_metrics(created_at);

ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert performance metrics"
  ON public.performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view performance metrics"
  ON public.performance_metrics FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 15. CLIENT ERRORS
CREATE TABLE public.client_errors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  user_id uuid,
  error_type text NOT NULL CHECK (error_type IN ('js_error', 'map_failure', 'search_failure', 'api_error')),
  error_message text NOT NULL,
  stack_trace text,
  page_path text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_errors_type ON client_errors(error_type);
CREATE INDEX idx_client_errors_created ON client_errors(created_at);

ALTER TABLE public.client_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert client errors"
  ON public.client_errors FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view client errors"
  ON public.client_errors FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 16. INTEGRATION HEALTH
CREATE TABLE public.integration_health (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id text NOT NULL,
  integration_type text NOT NULL CHECK (integration_type IN ('google_maps', 'geocoding', 'supabase')),
  success boolean NOT NULL,
  response_time_ms int,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_health_type ON integration_health(integration_type);
CREATE INDEX idx_integration_health_created ON integration_health(created_at);

ALTER TABLE public.integration_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert integration health"
  ON public.integration_health FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view integration health"
  ON public.integration_health FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- =====================================================
-- ENHANCE SEARCH_ANALYTICS WITH NEW COLUMNS
-- =====================================================
ALTER TABLE public.search_analytics 
  ADD COLUMN IF NOT EXISTS search_uuid uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS zero_results boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS refinements_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_to_first_click_ms int,
  ADD COLUMN IF NOT EXISTS first_click_position int,
  ADD COLUMN IF NOT EXISTS filter_change_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS map_mode_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS saved_search boolean DEFAULT false;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC PRICE/STATUS HISTORY LOGGING
-- =====================================================

-- Price change trigger for properties
CREATE OR REPLACE FUNCTION log_property_price_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.price IS DISTINCT FROM NEW.price AND OLD.price IS NOT NULL THEN
    INSERT INTO listing_price_history (
      entity_type, entity_id, old_price, new_price, 
      changed_at, change_reason, changed_by_type
    ) VALUES (
      'property', NEW.id, OLD.price, NEW.price,
      now(), 'manual', 'agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_property_price_change ON properties;
CREATE TRIGGER trigger_log_property_price_change
  AFTER UPDATE OF price ON properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_price_change();

-- Status change trigger for properties
CREATE OR REPLACE FUNCTION log_property_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.listing_status IS DISTINCT FROM NEW.listing_status THEN
    INSERT INTO listing_status_history (
      entity_type, entity_id, status_from, status_to,
      changed_at, changed_by_type
    ) VALUES (
      'property', NEW.id, OLD.listing_status::text, NEW.listing_status::text,
      now(), 'agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_log_property_status_change ON properties;
CREATE TRIGGER trigger_log_property_status_change
  AFTER UPDATE OF listing_status ON properties
  FOR EACH ROW
  EXECUTE FUNCTION log_property_status_change();