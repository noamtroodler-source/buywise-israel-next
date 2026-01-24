-- =============================================
-- COMPREHENSIVE ANALYTICS & BEHAVIOR TRACKING
-- =============================================

-- 1. Universal User Events Table
CREATE TABLE public.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  user_role TEXT,
  event_type TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_category TEXT NOT NULL,
  page_path TEXT NOT NULL,
  component TEXT,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  device_type TEXT,
  viewport_width INTEGER,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Indexes for efficient querying
CREATE INDEX idx_user_events_session ON public.user_events(session_id);
CREATE INDEX idx_user_events_user ON public.user_events(user_id);
CREATE INDEX idx_user_events_type ON public.user_events(event_type, event_name);
CREATE INDEX idx_user_events_created ON public.user_events(created_at);
CREATE INDEX idx_user_events_page ON public.user_events(page_path);
CREATE INDEX idx_user_events_category ON public.user_events(event_category);

-- RLS for user_events (allow inserts, admins can read all)
ALTER TABLE public.user_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
ON public.user_events FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all events"
ON public.user_events FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. Search Analytics Table
CREATE TABLE public.search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  listing_type TEXT,
  cities TEXT[],
  neighborhoods TEXT[],
  property_types TEXT[],
  price_min NUMERIC,
  price_max NUMERIC,
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  size_min NUMERIC,
  size_max NUMERIC,
  features_required TEXT[],
  results_count INTEGER,
  results_shown INTEGER,
  sort_option TEXT,
  page_number INTEGER DEFAULT 1,
  time_spent_ms INTEGER,
  clicked_result_ids UUID[],
  saved_result_ids UUID[],
  inquired_result_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_cities ON public.search_analytics USING GIN(cities);
CREATE INDEX idx_search_created ON public.search_analytics(created_at);
CREATE INDEX idx_search_session ON public.search_analytics(session_id);
CREATE INDEX idx_search_listing_type ON public.search_analytics(listing_type);

ALTER TABLE public.search_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert search analytics"
ON public.search_analytics FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view search analytics"
ON public.search_analytics FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Listing Lifecycle Table
CREATE TABLE public.listing_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  property_type TEXT,
  listing_type TEXT,
  initial_price NUMERIC,
  current_price NUMERIC,
  bedrooms INTEGER,
  size_sqm NUMERIC,
  agent_id UUID,
  developer_id UUID,
  agency_id UUID,
  listed_at TIMESTAMPTZ NOT NULL,
  first_inquiry_at TIMESTAMPTZ,
  first_price_change_at TIMESTAMPTZ,
  sold_rented_at TIMESTAMPTZ,
  delisted_at TIMESTAMPTZ,
  days_to_first_inquiry INTEGER,
  days_to_first_price_change INTEGER,
  days_on_market INTEGER,
  total_views INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  total_price_changes INTEGER DEFAULT 0,
  final_price NUMERIC,
  price_change_percent NUMERIC,
  outcome TEXT DEFAULT 'active',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_lifecycle_city ON public.listing_lifecycle(city);
CREATE INDEX idx_lifecycle_outcome ON public.listing_lifecycle(outcome);
CREATE INDEX idx_lifecycle_listed ON public.listing_lifecycle(listed_at);
CREATE INDEX idx_lifecycle_entity ON public.listing_lifecycle(entity_type, entity_id);
CREATE INDEX idx_lifecycle_agent ON public.listing_lifecycle(agent_id);
CREATE INDEX idx_lifecycle_developer ON public.listing_lifecycle(developer_id);

ALTER TABLE public.listing_lifecycle ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage listing lifecycle"
ON public.listing_lifecycle FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Agents can view their listing lifecycle"
ON public.listing_lifecycle FOR SELECT
USING (agent_id IN (SELECT id FROM agents WHERE user_id = auth.uid()));

CREATE POLICY "Developers can view their listing lifecycle"
ON public.listing_lifecycle FOR SELECT
USING (developer_id IN (SELECT id FROM developers WHERE user_id = auth.uid()));

-- 4. Advertiser Activity Table
CREATE TABLE public.advertiser_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  actor_type TEXT NOT NULL,
  actor_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_detail TEXT,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_advertiser_actor ON public.advertiser_activity(actor_type, actor_id);
CREATE INDEX idx_advertiser_action ON public.advertiser_activity(action_type);
CREATE INDEX idx_advertiser_created ON public.advertiser_activity(created_at);
CREATE INDEX idx_advertiser_user ON public.advertiser_activity(user_id);

ALTER TABLE public.advertiser_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own activity"
ON public.advertiser_activity FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all advertiser activity"
ON public.advertiser_activity FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own activity"
ON public.advertiser_activity FOR SELECT
USING (auth.uid() = user_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC LIFECYCLE TRACKING
-- =============================================

-- Trigger: Create lifecycle entry when property is published
CREATE OR REPLACE FUNCTION public.create_property_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = true AND (OLD.is_published = false OR OLD IS NULL) THEN
    INSERT INTO public.listing_lifecycle (
      entity_type, entity_id, city, neighborhood, property_type,
      listing_type, initial_price, current_price, bedrooms, size_sqm,
      agent_id, listed_at
    ) VALUES (
      'property', NEW.id, NEW.city, NEW.neighborhood, NEW.property_type::text,
      NEW.listing_status::text, NEW.price, NEW.price, NEW.bedrooms, NEW.size_sqm,
      NEW.agent_id, now()
    )
    ON CONFLICT (entity_type, entity_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_create_property_lifecycle
AFTER INSERT OR UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.create_property_lifecycle();

-- Trigger: Update lifecycle on property price change
CREATE OR REPLACE FUNCTION public.track_property_lifecycle_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price <> OLD.price THEN
    UPDATE public.listing_lifecycle
    SET 
      current_price = NEW.price,
      total_price_changes = total_price_changes + 1,
      first_price_change_at = COALESCE(first_price_change_at, now()),
      days_to_first_price_change = COALESCE(days_to_first_price_change, EXTRACT(DAY FROM now() - listed_at)::integer),
      price_change_percent = ((NEW.price - initial_price) / initial_price * 100),
      updated_at = now()
    WHERE entity_type = 'property' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_track_property_lifecycle_price
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.track_property_lifecycle_price();

-- Trigger: Update lifecycle on property status change (sold/rented)
CREATE OR REPLACE FUNCTION public.track_property_lifecycle_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.listing_status IN ('sold', 'rented') AND OLD.listing_status IN ('for_sale', 'for_rent') THEN
    UPDATE public.listing_lifecycle
    SET 
      sold_rented_at = now(),
      days_on_market = EXTRACT(DAY FROM now() - listed_at)::integer,
      outcome = NEW.listing_status::text,
      final_price = NEW.price,
      updated_at = now()
    WHERE entity_type = 'property' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_track_property_lifecycle_status
AFTER UPDATE ON public.properties
FOR EACH ROW EXECUTE FUNCTION public.track_property_lifecycle_status();

-- Trigger: Track first inquiry on property
CREATE OR REPLACE FUNCTION public.track_property_first_inquiry()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listing_lifecycle
  SET 
    first_inquiry_at = COALESCE(first_inquiry_at, now()),
    days_to_first_inquiry = COALESCE(days_to_first_inquiry, EXTRACT(DAY FROM now() - listed_at)::integer),
    total_inquiries = total_inquiries + 1,
    updated_at = now()
  WHERE entity_type = 'property' AND entity_id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_track_property_first_inquiry
AFTER INSERT ON public.property_inquiries
FOR EACH ROW EXECUTE FUNCTION public.track_property_first_inquiry();

-- Trigger: Increment views on lifecycle
CREATE OR REPLACE FUNCTION public.track_property_lifecycle_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listing_lifecycle
  SET 
    total_views = total_views + 1,
    updated_at = now()
  WHERE entity_type = 'property' AND entity_id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_track_property_lifecycle_views
AFTER INSERT ON public.property_views
FOR EACH ROW EXECUTE FUNCTION public.track_property_lifecycle_views();

-- Trigger: Track saves on lifecycle
CREATE OR REPLACE FUNCTION public.track_property_lifecycle_saves()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.listing_lifecycle
  SET 
    total_saves = total_saves + 1,
    updated_at = now()
  WHERE entity_type = 'property' AND entity_id = NEW.property_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_track_property_lifecycle_saves
AFTER INSERT ON public.favorites
FOR EACH ROW EXECUTE FUNCTION public.track_property_lifecycle_saves();