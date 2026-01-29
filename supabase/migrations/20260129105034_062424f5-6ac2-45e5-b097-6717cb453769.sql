-- =====================================================
-- Analytics Enhancement Migration
-- =====================================================

-- 1. Enhance price_drop_notifications with engagement tracking
ALTER TABLE public.price_drop_notifications
ADD COLUMN IF NOT EXISTS email_opened_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS link_clicked_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS resulted_in_inquiry BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resulted_in_save BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_token UUID DEFAULT gen_random_uuid();

-- Create index on tracking token for email open/click tracking
CREATE INDEX IF NOT EXISTS idx_price_drop_tracking_token 
ON public.price_drop_notifications(tracking_token);

-- 2. Create user_journeys table for cross-session journey tracking
CREATE TABLE IF NOT EXISTS public.user_journeys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  journey_stage TEXT DEFAULT 'awareness' CHECK (journey_stage IN ('awareness', 'consideration', 'decision', 'action', 'retention')),
  key_milestones JSONB DEFAULT '{}'::jsonb,
  first_touch_source TEXT,
  first_touch_medium TEXT,
  first_touch_campaign TEXT,
  last_touch_source TEXT,
  last_touch_medium TEXT,
  touchpoint_count INTEGER DEFAULT 0,
  days_since_first_visit INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 1,
  total_page_views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on user_journeys
ALTER TABLE public.user_journeys ENABLE ROW LEVEL SECURITY;

-- RLS: Users can view their own journey
CREATE POLICY "Users can view own journey" ON public.user_journeys
  FOR SELECT USING (auth.uid() = user_id);

-- RLS: System can insert/update journeys (via service role)
CREATE POLICY "Service can manage journeys" ON public.user_journeys
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for journey analytics
CREATE INDEX IF NOT EXISTS idx_user_journeys_stage ON public.user_journeys(journey_stage);
CREATE INDEX IF NOT EXISTS idx_user_journeys_created ON public.user_journeys(created_at);

-- 3. Create comparison_sessions table
CREATE TABLE IF NOT EXISTS public.comparison_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  property_ids UUID[] NOT NULL,
  comparison_duration_ms INTEGER,
  winner_property_id UUID,
  comparison_criteria JSONB DEFAULT '[]'::jsonb,
  outcome TEXT CHECK (outcome IN ('inquiry_sent', 'property_saved', 'continued_browsing', 'left_site', 'undetermined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on comparison_sessions
ALTER TABLE public.comparison_sessions ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can insert comparison sessions (for anonymous tracking)
CREATE POLICY "Anyone can insert comparison sessions" ON public.comparison_sessions
  FOR INSERT WITH CHECK (true);

-- RLS: Users can view their own comparison sessions
CREATE POLICY "Users can view own comparisons" ON public.comparison_sessions
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for comparison analytics
CREATE INDEX IF NOT EXISTS idx_comparison_sessions_created ON public.comparison_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_comparison_sessions_user ON public.comparison_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_comparison_sessions_outcome ON public.comparison_sessions(outcome);

-- 4. Create funnel_exit_feedback table
CREATE TABLE IF NOT EXISTS public.funnel_exit_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  funnel_type TEXT NOT NULL CHECK (funnel_type IN ('tool', 'inquiry', 'signup', 'search', 'checkout')),
  funnel_step TEXT,
  exit_reason TEXT CHECK (exit_reason IN ('too_complex', 'missing_info', 'just_browsing', 'found_alternative', 'technical_issue', 'price_concern', 'other')),
  feedback_text TEXT,
  page_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on funnel_exit_feedback
ALTER TABLE public.funnel_exit_feedback ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can submit feedback
CREATE POLICY "Anyone can submit funnel feedback" ON public.funnel_exit_feedback
  FOR INSERT WITH CHECK (true);

-- RLS: Admins can view all feedback (use has_role function)
CREATE POLICY "Admins can view funnel feedback" ON public.funnel_exit_feedback
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_funnel_exit_type ON public.funnel_exit_feedback(funnel_type);
CREATE INDEX IF NOT EXISTS idx_funnel_exit_reason ON public.funnel_exit_feedback(exit_reason);
CREATE INDEX IF NOT EXISTS idx_funnel_exit_created ON public.funnel_exit_feedback(created_at);

-- 5. Add trigger to update user_journeys on key events
CREATE OR REPLACE FUNCTION public.update_user_journey_milestone()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  milestone_key TEXT;
  current_milestones JSONB;
BEGIN
  -- Determine milestone based on event type
  CASE NEW.event_name
    WHEN 'search_performed' THEN milestone_key := 'first_search';
    WHEN 'property_saved' THEN milestone_key := 'first_save';
    WHEN 'inquiry_sent' THEN milestone_key := 'first_inquiry';
    WHEN 'share_clicked' THEN milestone_key := 'first_share';
    WHEN 'signup_completed' THEN milestone_key := 'signup';
    ELSE milestone_key := NULL;
  END CASE;

  IF milestone_key IS NOT NULL AND NEW.user_id IS NOT NULL THEN
    -- Get current milestones
    SELECT key_milestones INTO current_milestones
    FROM public.user_journeys
    WHERE user_id = NEW.user_id;

    -- Only set if not already set
    IF current_milestones IS NULL OR NOT (current_milestones ? milestone_key) THEN
      INSERT INTO public.user_journeys (user_id, key_milestones, touchpoint_count)
      VALUES (
        NEW.user_id,
        jsonb_build_object(milestone_key, now()),
        1
      )
      ON CONFLICT (user_id) DO UPDATE SET
        key_milestones = COALESCE(user_journeys.key_milestones, '{}'::jsonb) || jsonb_build_object(milestone_key, now()),
        touchpoint_count = user_journeys.touchpoint_count + 1,
        updated_at = now();
    ELSE
      -- Just increment touchpoint count
      UPDATE public.user_journeys
      SET touchpoint_count = touchpoint_count + 1, updated_at = now()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on user_events
DROP TRIGGER IF EXISTS trg_update_journey_milestone ON public.user_events;
CREATE TRIGGER trg_update_journey_milestone
  AFTER INSERT ON public.user_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_journey_milestone();

-- 6. Function to promote journey stage based on milestones
CREATE OR REPLACE FUNCTION public.calculate_journey_stage(milestones JSONB)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
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