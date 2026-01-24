
# Comprehensive Analytics & Behavior Tracking System

## Current State Analysis

Your platform already has foundational tracking in place:

**What's Currently Tracked:**
- Property views (with session ID, user ID, source, referrer)
- Project views (with session ID, viewer ID)
- Property inquiries (WhatsApp, call, email, form - with user details)
- Project inquiries (with budget range, preferred unit type)
- Favorites/saves (with category, ruled out reason)
- Recently viewed properties/projects
- Agent/developer last_active_at timestamps
- Price changes (original_price, price_reduced_at)
- Search alerts (filters saved by users)
- Tool feedback (ratings and comments)
- Admin audit log (actions taken by admins)

**Critical Gaps Identified:**
1. No comprehensive user session/journey tracking
2. No click-level event tracking (buttons, filters, navigation)
3. No search behavior tracking (what users search for)
4. No listing lifecycle metrics (time to sell/rent, days on market)
5. No agent/developer dashboard activity tracking
6. No A/B test or feature usage tracking
7. No calculator/tool usage analytics
8. No content engagement tracking (blog, guides)
9. No geographic/device/referrer analytics aggregation
10. No price drop velocity or market timing insights

---

## Strategic Analytics Architecture

### Phase 1: Event Tracking Infrastructure

#### 1.1 Create Universal Events Table
A flexible events table to capture ALL user interactions:

```sql
CREATE TABLE user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Who
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  user_role TEXT, -- 'buyer', 'agent', 'developer', 'admin', 'anonymous'
  
  -- What
  event_type TEXT NOT NULL, -- 'click', 'view', 'search', 'filter', 'scroll', 'submit'
  event_name TEXT NOT NULL, -- 'property_card_click', 'whatsapp_button', 'filter_apply'
  event_category TEXT NOT NULL, -- 'navigation', 'engagement', 'conversion', 'search'
  
  -- Where
  page_path TEXT NOT NULL,
  component TEXT, -- 'PropertyCard', 'SearchFilters', 'ContactForm'
  
  -- Context
  properties JSONB DEFAULT '{}', -- Flexible event-specific data
  
  -- When
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Device/Environment
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  viewport_width INTEGER,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Indexes for common queries
CREATE INDEX idx_user_events_session ON user_events(session_id);
CREATE INDEX idx_user_events_user ON user_events(user_id);
CREATE INDEX idx_user_events_type ON user_events(event_type, event_name);
CREATE INDEX idx_user_events_created ON user_events(created_at);
CREATE INDEX idx_user_events_page ON user_events(page_path);
```

#### 1.2 Create Search Analytics Table
Track what users are searching for (invaluable for understanding demand):

```sql
CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID,
  
  -- Search parameters
  listing_type TEXT, -- 'for_sale', 'for_rent', 'project'
  cities TEXT[], -- Array of cities searched
  neighborhoods TEXT[],
  property_types TEXT[],
  price_min NUMERIC,
  price_max NUMERIC,
  bedrooms_min INTEGER,
  bedrooms_max INTEGER,
  size_min NUMERIC,
  size_max NUMERIC,
  features_required TEXT[],
  
  -- Results
  results_count INTEGER,
  results_shown INTEGER,
  
  -- Behavior
  sort_option TEXT,
  page_number INTEGER DEFAULT 1,
  time_spent_ms INTEGER,
  
  -- Conversion
  clicked_result_ids UUID[],
  saved_result_ids UUID[],
  inquired_result_ids UUID[],
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_search_cities ON search_analytics USING GIN(cities);
CREATE INDEX idx_search_created ON search_analytics(created_at);
```

#### 1.3 Create Listing Lifecycle Table
Track the complete journey of every listing:

```sql
CREATE TABLE listing_lifecycle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference
  entity_type TEXT NOT NULL, -- 'property', 'project'
  entity_id UUID NOT NULL,
  
  -- Listing details at time of event
  city TEXT NOT NULL,
  neighborhood TEXT,
  property_type TEXT,
  listing_type TEXT, -- 'for_sale', 'for_rent'
  initial_price NUMERIC,
  current_price NUMERIC,
  bedrooms INTEGER,
  size_sqm NUMERIC,
  
  -- Agent/Developer
  agent_id UUID,
  developer_id UUID,
  agency_id UUID,
  
  -- Lifecycle timestamps
  listed_at TIMESTAMPTZ NOT NULL,
  first_inquiry_at TIMESTAMPTZ,
  first_price_change_at TIMESTAMPTZ,
  sold_rented_at TIMESTAMPTZ,
  delisted_at TIMESTAMPTZ,
  
  -- Metrics
  days_to_first_inquiry INTEGER,
  days_to_first_price_change INTEGER,
  days_on_market INTEGER,
  total_views INTEGER DEFAULT 0,
  total_saves INTEGER DEFAULT 0,
  total_inquiries INTEGER DEFAULT 0,
  total_price_changes INTEGER DEFAULT 0,
  final_price NUMERIC,
  price_change_percent NUMERIC,
  
  -- Outcome
  outcome TEXT, -- 'sold', 'rented', 'delisted', 'expired', 'active'
  
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(entity_type, entity_id)
);

CREATE INDEX idx_lifecycle_city ON listing_lifecycle(city);
CREATE INDEX idx_lifecycle_outcome ON listing_lifecycle(outcome);
CREATE INDEX idx_lifecycle_listed ON listing_lifecycle(listed_at);
```

#### 1.4 Create Agent/Developer Activity Table
Track how advertisers use the platform:

```sql
CREATE TABLE advertiser_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  user_id UUID NOT NULL,
  actor_type TEXT NOT NULL, -- 'agent', 'developer', 'agency_admin'
  actor_id UUID NOT NULL,
  
  -- What
  action_type TEXT NOT NULL, -- 'login', 'listing_create', 'listing_edit', 'inquiry_view', 'inquiry_respond', 'settings_update', 'analytics_view'
  action_detail TEXT,
  
  -- Context
  entity_type TEXT, -- 'property', 'project', 'inquiry', 'settings'
  entity_id UUID,
  
  -- Data
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_advertiser_actor ON advertiser_activity(actor_type, actor_id);
CREATE INDEX idx_advertiser_action ON advertiser_activity(action_type);
CREATE INDEX idx_advertiser_created ON advertiser_activity(created_at);
```

---

### Phase 2: Frontend Tracking Implementation

#### 2.1 Create Universal Event Tracker Hook
A single hook to use throughout the app:

```typescript
// src/hooks/useEventTracking.tsx
export function useEventTracking() {
  const { user } = useAuth();
  const location = useLocation();
  
  const trackEvent = useCallback(async (
    eventType: string,
    eventName: string,
    category: string,
    properties?: Record<string, any>
  ) => {
    const sessionId = getOrCreateSessionId();
    const deviceInfo = getDeviceInfo();
    const utmParams = getUTMParams();
    
    await supabase.from('user_events').insert({
      session_id: sessionId,
      user_id: user?.id || null,
      user_role: getUserRole(user),
      event_type: eventType,
      event_name: eventName,
      event_category: category,
      page_path: location.pathname,
      properties: properties || {},
      ...deviceInfo,
      ...utmParams,
    });
  }, [user, location]);
  
  return { trackEvent };
}
```

#### 2.2 Events to Track by Category

**Navigation Events:**
- Page views (already done via route changes)
- Tab switches
- Accordion/collapsible opens
- Modal opens/closes
- Back button usage

**Search & Filter Events:**
- Search initiated
- Filter applied (each filter type)
- Filter cleared
- Sort changed
- Results scrolled
- "Load more" / pagination

**Engagement Events:**
- Property/project card hover (>2 seconds)
- Property/project card click
- Image gallery navigation
- Map interaction
- Calculator usage (inputs, results)
- Blog article read (scroll depth)
- Share button clicks (platform)
- Compare tool usage

**Conversion Events:**
- WhatsApp click (already tracked)
- Call click (already tracked)
- Email click (already tracked)
- Form submit (already tracked)
- Save/favorite (already tracked)
- Search alert created
- Account created

**Agent/Developer Dashboard Events:**
- Dashboard section views
- Listing created/edited/deleted
- Inquiry viewed
- Inquiry responded
- Analytics viewed
- Settings changed

---

### Phase 3: Admin Analytics Dashboard Enhancements

#### 3.1 New Analytics Tabs

Add these new tabs to the Admin Analytics page:

**"User Behavior" Tab:**
- Session metrics (avg duration, pages per session, bounce rate)
- Top pages by views
- User flow visualization
- Device/browser breakdown
- Geographic heatmap
- Time-of-day activity patterns

**"Search Intelligence" Tab:**
- Most searched cities (demand signal)
- Most searched price ranges
- Most requested features
- Searches with zero results (unmet demand)
- Search-to-save conversion rate
- Search-to-inquiry conversion rate

**"Listing Intelligence" Tab:**
- Average days on market by city
- Time to first inquiry by city/price
- Price reduction patterns
- Optimal listing price analysis
- Seasonal trends
- Agent performance by listing success

**"Advertiser Analytics" Tab:**
- Agent login frequency
- Agent response times
- Listings per agent (active vs total)
- Inquiry response rates
- Most active agents
- Agent retention metrics

---

### Phase 4: Derived Metrics & Insights

#### 4.1 Computed Metrics (Database Functions)

```sql
-- Calculate days on market
CREATE OR REPLACE FUNCTION calculate_days_on_market()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.listing_status IN ('sold', 'rented') AND OLD.listing_status IN ('for_sale', 'for_rent') THEN
    -- Update lifecycle table
    UPDATE listing_lifecycle
    SET 
      sold_rented_at = now(),
      days_on_market = EXTRACT(DAY FROM now() - listed_at),
      outcome = NEW.listing_status,
      final_price = NEW.price
    WHERE entity_type = 'property' AND entity_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 4.2 Key Business Intelligence Queries

**Market Timing Insights:**
- Average days to sell by city and price range
- Price drop frequency before sale
- Optimal listing day of week
- Seasonal velocity patterns

**Demand Signals:**
- Most searched but least available cities
- Price gaps (where searches > listings)
- Feature popularity vs availability
- User save patterns

**Agent/Developer Performance:**
- Inquiry response time vs success rate
- Listing quality score (views/inquiries ratio)
- Retention and churn indicators

---

## Implementation Summary

### Database Changes (4 new tables):
1. `user_events` - Universal event tracking
2. `search_analytics` - Search behavior tracking
3. `listing_lifecycle` - Listing journey tracking
4. `advertiser_activity` - Agent/developer dashboard tracking

### New Hooks:
1. `useEventTracking` - Universal event tracker
2. `useSearchTracking` - Search-specific tracking
3. `useListingLifecycle` - Admin listing intelligence
4. `useAdvertiserAnalytics` - Agent/developer activity

### New Admin Dashboard Components:
1. `UserBehaviorTab` - Session and journey analytics
2. `SearchIntelligenceTab` - Search demand insights
3. `ListingIntelligenceTab` - Market timing and velocity
4. `AdvertiserAnalyticsTab` - Agent/developer performance

### Triggers & Functions:
1. Property status change trigger → update lifecycle
2. Price change trigger → track in lifecycle
3. Inquiry creation trigger → update first_inquiry_at
4. View tracking trigger → update total_views

---

## Strategic Value

This system will enable you to:

1. **Understand Demand**: What are users searching for but not finding?
2. **Price Optimization**: How long do listings at different prices stay on market?
3. **Agent Quality**: Which agents respond fastest and convert best?
4. **Market Timing**: When is the best time to list? To reduce price?
5. **Feature Prioritization**: What filters/features are most used?
6. **Conversion Optimization**: Where in the funnel do users drop off?
7. **Geographic Insights**: Which cities are hottest? Cooling off?
8. **User Retention**: What brings users back? What keeps agents active?

This is a comprehensive, first-party analytics system that gives you complete control over your data and insights - far more valuable than any third-party analytics tool for a real estate marketplace.
