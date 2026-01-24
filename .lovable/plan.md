
# Comprehensive Analytics Enhancement Plan

## Executive Summary

This plan addresses 15 categories of advanced analytics metrics you've requested. After a thorough audit, I've identified what's **already tracked**, what **partially exists**, and what needs to be **built from scratch**. The implementation is organized into 6 implementation phases with corresponding database migrations and frontend tracking hooks.

---

## Current State Analysis

### ✅ Already Tracked (Working)

| Metric Category | Current Coverage |
|-----------------|------------------|
| Basic page views | `property_views` (216 records), `project_views` via triggers |
| Search funnels | `search_analytics` with cities, price ranges, clicked/saved IDs |
| Listing lifecycle summary | `listing_lifecycle` tracks initial/current price, DOM, inquiries |
| Advertiser actions | `advertiser_activity` logs dashboard views, listing CRUD |
| Tool feedback | `tool_feedback` captures ratings and comments |
| Price drop alerts | `price_drop_notifications` with percent change |
| User events | `user_events` tracks clicks, page views, UTM, device |

### ⚠️ Partially Exists (Needs Enhancement)

| Your Request | Current State | Gap |
|--------------|---------------|-----|
| Search journey | Has result clicks/saves | Missing: `position_in_results`, `filter_hash`, `zero_results`, `refinements_count`, `time_to_first_click_ms` |
| Listing price history | Only tracks initial vs current | Missing: Full **history** of every price change |
| Listing status history | Only tracks final outcome | Missing: Full **timeline** of status transitions |
| Page engagement | Basic page views | Missing: `active_time_ms`, `scroll_depth_max`, `exit_type`, `engaged` flag |
| Tool tracking | Only feedback | Missing: `inputs_json`, `outputs_summary`, `step_events`, `completion_status` |

### ❌ Not Yet Tracked (New Build Required)

| Your Request | Required |
|--------------|----------|
| Listing impressions | New table + frontend IntersectionObserver tracking |
| Location module interactions | New table + hooks in PropertyLocation component |
| Lead response quality | New table + agent/developer response tracking |
| Advertiser inventory quality snapshots | New daily snapshot table + cron/scheduled job |
| Listing micro-signals | New tracking for copy events, gallery engagement, floorplan views |
| Content engagement | New table for blog/guide completion tracking |
| Funnel milestones | New derived milestone tracking |
| Experiments exposure | New table for A/B test assignment tracking |
| Performance metrics | New table for Core Web Vitals, errors, integration health |
| Market snapshots | New derived daily/weekly aggregation tables |

---

## Implementation Plan

### Phase 1: Database Schema Expansion (12 new tables)

Create the following new tables:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│ NEW TABLES                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ 1. listing_impressions (property + project visibility tracking)         │
│ 2. page_engagement (active time, scroll depth, exit type)               │
│ 3. listing_price_history (full price change audit trail)                │
│ 4. listing_status_history (full status transition timeline)             │
│ 5. tool_runs (calculator input/output tracking)                         │
│ 6. tool_step_events (step-by-step abandonment tracking)                 │
│ 7. location_module_events (anchor clicks, travel modes, custom places)  │
│ 8. lead_response_events (response time, type, outcome, loss reason)     │
│ 9. advertiser_quality_snapshots (daily inventory quality metrics)       │
│ 10. listing_micro_signals (copy, gallery, floorplan, compare events)    │
│ 11. content_engagement (blog/guide completion, scroll, next action)     │
│ 12. user_milestones (funnel milestone tracking)                         │
│ 13. experiment_exposures (A/B test variant assignment)                  │
│ 14. performance_metrics (Core Web Vitals, errors, integration health)   │
│ 15. user_preferences (non-PII buyer preferences)                        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Enhanced existing tables:**
- `search_analytics`: Add 8 new columns (search_id, zero_results, refinements_count, time_to_first_click_ms, first_click_position, filter_change_count, map_mode_used, saved_search)

### Phase 2: Listing Impressions & Visibility Tracking

**New Table: `listing_impressions`**
```text
- id (uuid)
- entity_type ('property' | 'project')
- entity_id (uuid)
- search_id (uuid, nullable) → links to search_analytics
- session_id (text)
- user_id (uuid, nullable)
- position_in_results (int)
- page_number (int)
- sort_option (text)
- filter_hash (text) → MD5 of applied filters for grouping
- viewport_visible (boolean)
- time_visible_ms (int, nullable)
- was_promoted (boolean)
- promotion_type (text, nullable)
- card_variant (text, nullable) → for A/B testing
- created_at (timestamptz)
```

**Frontend Implementation:**
- Create `useImpressionTracking` hook using IntersectionObserver
- Track when cards enter/exit viewport with visibility duration
- Integrate into `PropertyCard.tsx` and project cards on listing pages
- Calculate `filter_hash` from current filter state

### Phase 3: Engagement & Behavioral Depth

**New Table: `page_engagement`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- page_path (text)
- entity_type (text, nullable) → 'property', 'project', 'blog', 'tool'
- entity_id (uuid, nullable)
- active_time_ms (int) → only counts when tab is visible
- scroll_depth_max (int) → 0-100 percent
- interactions_count (int) → clicks, hovers, form inputs
- exit_type ('back' | 'navigate' | 'close' | 'external')
- engaged (boolean) → derived: active_time > 10s OR scroll > 50% OR interactions > 2
- created_at (timestamptz)
```

**Frontend Implementation:**
- Create `usePageEngagement` hook with:
  - `document.visibilitychange` listener for active time
  - Scroll depth tracking (throttled)
  - Interaction counter
  - `beforeunload` / navigation detection for exit type
- Integrate into property detail, project detail, blog, and tool pages

### Phase 4: Full Price & Status History

**New Table: `listing_price_history`**
```text
- id (uuid)
- entity_type ('property' | 'project')
- entity_id (uuid)
- old_price (numeric)
- new_price (numeric)
- change_percent (numeric) → calculated
- changed_at (timestamptz)
- change_reason (text, nullable) → 'manual', 'renewal', 'market_adjustment', 'index_linked'
- changed_by_type ('agent' | 'developer' | 'admin' | 'system')
- changed_by_id (uuid, nullable)
- index_adjustment_applied (boolean, default false) → for projects
```

**New Table: `listing_status_history`**
```text
- id (uuid)
- entity_type ('property' | 'project')
- entity_id (uuid)
- status_from (text)
- status_to (text)
- changed_at (timestamptz)
- reason (text, nullable) → 'sold', 'rented', 'expired', 'withdrawn', 'duplicate', 'renewed'
- changed_by_type ('agent' | 'developer' | 'admin' | 'system' | 'auto')
- changed_by_id (uuid, nullable)
- notes (text, nullable)
```

**Database Triggers:**
- `log_property_price_change()` → INSERT into listing_price_history on properties.price change
- `log_property_status_change()` → INSERT into listing_status_history on properties.listing_status change
- Same for projects table

### Phase 5: Enhanced Search Intelligence

**Modify `search_analytics` table - Add columns:**
```text
+ search_id (uuid) → unique identifier for this search session
+ zero_results (boolean)
+ refinements_count (int) → how many filter changes before this search
+ time_to_first_click_ms (int, nullable)
+ first_click_position (int, nullable)
+ filter_change_sequence (jsonb, nullable) → ordered list of filter changes
+ map_mode_used (boolean)
+ saved_search (boolean) → did user save this as an alert
```

**Frontend Implementation:**
- Update `useSearchTracking` hook to:
  - Generate persistent `search_id` per search session
  - Track filter changes with sequence
  - Calculate time to first click
  - Track position of first clicked result
  - Detect map mode usage

### Phase 6: Tool & Calculator Deep Tracking

**New Table: `tool_runs`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- tool_name (text) → 'mortgage_calculator', 'purchase_tax', 'rent_vs_buy', etc.
- started_at (timestamptz)
- completed_at (timestamptz, nullable)
- completion_status ('completed' | 'abandoned' | 'error')
- inputs_json (jsonb) → bucketed/anonymized (price ranges, not exact values)
- outputs_summary_json (jsonb) → key results
- related_listing_id (uuid, nullable) → if launched from a property page
- next_action (text, nullable) → 'save', 'inquiry', 'search', 'exit'
```

**New Table: `tool_step_events`**
```text
- id (uuid)
- tool_run_id (uuid) → FK to tool_runs
- step_name (text)
- step_order (int)
- entered_at (timestamptz)
- exited_at (timestamptz, nullable)
- abandoned (boolean)
- inputs_at_step (jsonb, nullable)
```

**Frontend Implementation:**
- Create `useToolTracking` hook
- Integrate into all calculator components:
  - MortgageCalculator
  - PurchaseTaxCalculator
  - RentVsBuyCalculator
  - TrueCostCalculator
  - RenovationCostEstimator
  - NewConstructionCostCalculator
  - RentalIncomeCalculator

### Phase 7: Location Module Tracking

**New Table: `location_module_events`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- property_id (uuid)
- event_type (text):
  - 'module_open'
  - 'anchor_click'
  - 'nearby_place_expand'
  - 'custom_place_add'
  - 'travel_mode_toggle'
  - 'route_click'
  - 'search_area_click'
- anchor_type (text, nullable) → 'orientation', 'daily', 'mobility'
- travel_mode (text, nullable) → 'walk', 'drive', 'transit'
- custom_place_type (text, nullable) → 'school', 'work', 'family', 'other'
- metadata (jsonb, nullable)
- created_at (timestamptz)
```

**Frontend Implementation:**
- Create `useLocationModuleTracking` hook
- Integrate into `PropertyLocation.tsx`:
  - Track map interactions
  - Track anchor/POI clicks
  - Track travel mode changes
  - Track custom location additions

### Phase 8: Lead Response Quality

**New Table: `lead_response_events`**
```text
- id (uuid)
- inquiry_id (uuid) → FK to property_inquiries or project_inquiries
- inquiry_type ('property' | 'project')
- agent_id (uuid, nullable)
- developer_id (uuid, nullable)
- first_response_time_minutes (int, nullable)
- response_type ('call' | 'whatsapp' | 'email' | 'sms')
- response_length (int, nullable) → character count
- outcome ('visit_scheduled' | 'info_provided' | 'closed_won' | 'closed_lost' | 'no_response')
- loss_reason (text, nullable) → 'price', 'location', 'timing', 'competition', 'unqualified', 'other'
- notes (text, nullable)
- responded_at (timestamptz)
- created_at (timestamptz)
```

**Integration:**
- Add tracking UI in agent/developer lead management
- Calculate response time automatically from inquiry creation

### Phase 9: Advertiser Quality Snapshots

**New Table: `advertiser_quality_snapshots`**
```text
- id (uuid)
- snapshot_date (date)
- actor_type ('agent' | 'developer' | 'agency')
- actor_id (uuid)
- total_listings (int)
- avg_photo_count (numeric)
- pct_with_sqm (numeric)
- pct_with_floor (numeric)
- pct_with_parking (numeric)
- pct_with_description (numeric)
- avg_description_length (int)
- verification_rate (numeric)
- stale_listing_rate (numeric) → listings not renewed in 30+ days
- price_update_frequency (numeric) → avg days between price updates
- response_rate (numeric)
- avg_response_time_hours (numeric)
- created_at (timestamptz)
```

**Implementation:**
- Create scheduled function (edge function or database function) to run daily
- Aggregate from properties, projects, property_inquiries

### Phase 10: Listing Micro-Signals

**New Table: `listing_micro_signals`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- entity_type ('property' | 'project')
- entity_id (uuid)
- signal_type (text):
  - 'copy_price'
  - 'copy_phone'
  - 'copy_address'
  - 'image_view'
  - 'gallery_open'
  - 'gallery_time'
  - 'floorplan_view'
  - 'mortgage_calc_launch'
  - 'cost_calc_launch'
  - 'compare_add'
  - 'compare_remove'
- signal_data (jsonb, nullable):
  - For gallery: { images_viewed: 5, time_in_gallery_ms: 12000 }
  - For copy: { copied_value: 'phone' }
- created_at (timestamptz)
```

**Frontend Implementation:**
- Create `useMicroSignalTracking` hook
- Integrate into:
  - PropertyHero (gallery tracking)
  - PropertyDetails (copy buttons)
  - Calculator launch buttons on property pages
  - Compare functionality

### Phase 11: Content Engagement

**New Table: `content_engagement`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- content_type ('blog_post' | 'guide' | 'glossary')
- content_id (uuid)
- completion_percent (int) → 0-100
- scroll_depth_max (int)
- active_time_ms (int)
- next_action (text, nullable) → 'search', 'tool', 'inquiry', 'another_article', 'exit'
- next_action_target (text, nullable) → specific page/tool navigated to
- created_at (timestamptz)
```

**Frontend Implementation:**
- Create `useContentEngagement` hook
- Integrate into BlogPost, Guide components

### Phase 12: Funnel Milestones & User Preferences

**New Table: `user_milestones`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- milestone (text):
  - 'used_filters'
  - 'viewed_listing'
  - 'saved_listing'
  - 'ran_tool'
  - 'started_inquiry'
  - 'completed_inquiry'
  - 'created_account'
  - 'returned_7d'
  - 'returned_30d'
- first_reached_at (timestamptz)
- reach_count (int, default 1)
- metadata (jsonb, nullable)
```

**New Table: `user_preferences`**
```text
- id (uuid)
- user_id (uuid) → FK to auth.users
- buyer_type (text, nullable) → 'first_time', 'upgrader', 'investor', 'oleh'
- timeline (text, nullable) → 'immediate', '3_months', '6_months', 'exploring'
- citizenship (text, nullable) → 'israeli', 'oleh', 'foreign'
- preferred_currency (text, default 'ILS')
- must_have_features (text[], nullable)
- deal_breakers (text[], nullable)
- updated_at (timestamptz)
```

### Phase 13: Experiments & Performance

**New Table: `experiment_exposures`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- experiment_name (text)
- variant (text)
- component (text, nullable)
- exposed_at (timestamptz)
- converted (boolean, default false)
- converted_at (timestamptz, nullable)
```

**New Table: `performance_metrics`**
```text
- id (uuid)
- session_id (text)
- page_path (text)
- route_load_time_ms (int, nullable)
- lcp_ms (int, nullable) → Largest Contentful Paint
- cls (numeric, nullable) → Cumulative Layout Shift
- inp_ms (int, nullable) → Interaction to Next Paint
- created_at (timestamptz)
```

**New Table: `client_errors`**
```text
- id (uuid)
- session_id (text)
- user_id (uuid, nullable)
- error_type ('js_error' | 'map_failure' | 'search_failure' | 'api_error')
- error_message (text)
- stack_trace (text, nullable)
- page_path (text)
- metadata (jsonb, nullable)
- created_at (timestamptz)
```

**New Table: `integration_health`**
```text
- id (uuid)
- session_id (text)
- integration_type ('google_maps' | 'geocoding' | 'supabase')
- success (boolean)
- response_time_ms (int, nullable)
- error_message (text, nullable)
- created_at (timestamptz)
```

---

## Admin Dashboard Enhancements

### New Dashboard Tabs/Sections

1. **Impressions Tab** (New)
   - Impression-to-click ratio by city
   - Position performance heatmap
   - Promoted vs organic comparison

2. **Engagement Tab** (Enhanced)
   - Average active time by page type
   - Scroll depth distribution
   - Exit type breakdown
   - Engaged session rate

3. **Price Intelligence Tab** (New)
   - Price change timeline visualization
   - Average days to first price drop
   - Price reduction patterns by city
   - Status transition Sankey diagram

4. **Tool Performance Tab** (New)
   - Completion rates by tool
   - Step abandonment funnel
   - Input distribution analysis
   - Tool-to-action conversion

5. **Location Module Tab** (New)
   - Most clicked anchor types
   - Travel mode preferences
   - Custom place additions rate
   - Route engagement metrics

6. **Lead Quality Tab** (New)
   - Response time distribution
   - Outcome breakdown
   - Loss reason analysis
   - Agent response leaderboard

7. **Content Performance Tab** (New)
   - Article completion rates
   - Content-to-action attribution
   - Guide engagement scores

8. **Funnel Health Tab** (New)
   - Milestone progression chart
   - Drop-off points visualization
   - Cohort retention analysis

9. **Performance Tab** (New)
   - Core Web Vitals trends
   - Error rate monitoring
   - Integration health status

10. **Experiment Results Tab** (New)
    - Active experiments list
    - Variant performance comparison
    - Statistical significance indicators

---

## File Changes Summary

### New Files to Create

**Hooks (8 new):**
```text
src/hooks/useImpressionTracking.tsx
src/hooks/usePageEngagement.tsx
src/hooks/useToolTracking.tsx
src/hooks/useLocationModuleTracking.tsx
src/hooks/useMicroSignalTracking.tsx
src/hooks/useContentEngagement.tsx
src/hooks/useMilestoneTracking.tsx
src/hooks/usePerformanceTracking.tsx
```

**Admin Analytics Components (10 new):**
```text
src/components/admin/analytics/ImpressionsTab.tsx
src/components/admin/analytics/EngagementTab.tsx
src/components/admin/analytics/PriceIntelligenceTab.tsx
src/components/admin/analytics/ToolPerformanceTab.tsx
src/components/admin/analytics/LocationModuleTab.tsx
src/components/admin/analytics/LeadQualityTab.tsx
src/components/admin/analytics/ContentPerformanceTab.tsx
src/components/admin/analytics/FunnelHealthTab.tsx
src/components/admin/analytics/PerformanceMonitorTab.tsx
src/components/admin/analytics/ExperimentResultsTab.tsx
```

**Data Hooks (10 new):**
```text
src/hooks/useImpressionAnalytics.tsx
src/hooks/useEngagementAnalytics.tsx
src/hooks/usePriceHistoryAnalytics.tsx
src/hooks/useToolAnalytics.tsx
src/hooks/useLocationModuleAnalytics.tsx
src/hooks/useLeadQualityAnalytics.tsx
src/hooks/useContentAnalytics.tsx
src/hooks/useFunnelAnalytics.tsx
src/hooks/usePerformanceAnalytics.tsx
src/hooks/useExperimentAnalytics.tsx
```

### Files to Modify

**Existing Hooks:**
```text
src/hooks/useSearchTracking.tsx → Add search_id, zero_results, refinements tracking
src/hooks/useEventTracking.tsx → Enhance with engagement metrics
```

**Components to Integrate Tracking:**
```text
src/components/property/PropertyCard.tsx → Add impression tracking
src/components/property/PropertyHero.tsx → Add gallery micro-signals
src/components/property/PropertyLocation.tsx → Add location module tracking
src/pages/Listings.tsx → Add impression + enhanced search tracking
src/pages/Projects.tsx → Add impression tracking
src/pages/PropertyDetails.tsx → Add engagement + micro-signals
src/components/tools/*.tsx → Add tool run tracking (7 calculators)
```

**Admin Dashboard:**
```text
src/pages/admin/AdminAnalytics.tsx → Add 10 new tabs
src/components/admin/analytics/DataHealthCard.tsx → Monitor all new tables
```

---

## Database Migration Summary

**15 new tables** + **8 columns added to search_analytics** + **4 new triggers**

This is a substantial schema change that will be executed via database migrations with proper RLS policies for each table.

---

## Priority Implementation Order

1. **Week 1**: Listing Impressions + Page Engagement (immediate visibility into what users see)
2. **Week 2**: Price/Status History triggers (automatic, runs in background)
3. **Week 3**: Enhanced Search Intelligence (fills major gap in conversion tracking)
4. **Week 4**: Tool Deep Tracking (understand calculator value)
5. **Week 5**: Location Module + Micro-signals (engagement depth)
6. **Week 6**: Lead Quality + Content Engagement
7. **Week 7**: Milestones + Preferences + Experiments
8. **Week 8**: Performance Monitoring + Dashboard Polish

---

## Expected Outcomes

After full implementation:
- **Know what users see** (impressions) vs **what they click** (events)
- **Full audit trail** of every price and status change
- **Search intent signals** including why searches fail
- **Tool effectiveness** measurement from input to action
- **Location module ROI** - your confidence engine tracked
- **Lead quality metrics** beyond just counts
- **Content attribution** - which guides drive action
- **Funnel health** with milestone progression
- **A/B testing infrastructure** ready for experiments
- **Performance monitoring** to catch silent killers
