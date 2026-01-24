

# Admin Dashboard Analytics Tabs & Component Integration Plan

## Overview

This plan covers two major workstreams:
1. **10 New Admin Dashboard Analytics Tabs** - Visualizing the data from the new tracking tables
2. **Component Integration** - Wiring the tracking hooks into UI components to capture data

---

## Part 1: Admin Dashboard - 10 New Analytics Tabs

### Current State
The admin analytics page (`/admin/analytics`) has **11 existing tabs**:
- Overview, User Behavior, Search Intel, Listing Intel, Advertisers, Inventory, Agents, Inquiries, Growth, Market, Cities

### New Tabs to Add

| # | Tab Name | Data Source Tables | Key Visualizations |
|---|----------|-------------------|-------------------|
| 1 | Impressions | `listing_impressions` | Impression-to-click ratio, position heatmap, promoted vs organic |
| 2 | Engagement | `page_engagement` | Active time distribution, scroll depth, exit types, engaged rate |
| 3 | Price Intel | `listing_price_history`, `listing_status_history` | Price change timeline, days to first drop, status Sankey |
| 4 | Tool Performance | `tool_runs`, `tool_step_events` | Completion rates, step abandonment funnel, tool-to-action |
| 5 | Location Module | `location_module_events` | Anchor clicks, travel modes, custom places, route engagement |
| 6 | Lead Quality | `lead_response_events` | Response time distribution, outcomes, loss reasons, agent leaderboard |
| 7 | Content | `content_engagement` | Article completion rates, content-to-action attribution |
| 8 | Funnel Health | `user_milestones` | Milestone progression, drop-off visualization, cohort analysis |
| 9 | Performance | `performance_metrics`, `client_errors`, `integration_health` | Core Web Vitals, error rates, integration status |
| 10 | Experiments | `experiment_exposures` | Active experiments, variant comparison, conversion rates |

### Implementation Details

#### Tab 1: Impressions Tab (`ImpressionsTab.tsx`)

**Data Hook**: `useImpressionAnalytics.tsx`
```text
Queries:
- Total impressions by entity type
- Click-through rate by position (1-10, 11-20, etc.)
- Promoted vs organic impression comparison
- Filter hash analysis (which filter combos get most views)
```

**Visualizations**:
- **Position Performance Heatmap**: Shows CTR by result position (positions 1-5 get high engagement)
- **Promoted vs Organic Bar Chart**: Compare impression counts and CTR
- **Top Filter Combinations Table**: Which searches generate most impressions

---

#### Tab 2: Engagement Tab (`EngagementDepthTab.tsx`)

**Data Hook**: `useEngagementAnalytics.tsx`
```text
Queries:
- Average active time by page type (property, project, blog, tool)
- Scroll depth distribution (0-25%, 25-50%, 50-75%, 75-100%)
- Exit type breakdown (back, navigate, close, external)
- Engaged session rate
```

**Visualizations**:
- **Active Time by Page Type**: Horizontal bar chart
- **Scroll Depth Distribution**: Pie chart with 4 segments
- **Exit Type Breakdown**: Donut chart
- **Engagement Rate Trend**: Line chart over time

---

#### Tab 3: Price Intelligence Tab (`PriceIntelligenceTab.tsx`)

**Data Hook**: `usePriceHistoryAnalytics.tsx`
```text
Queries:
- Price changes per city with average change percent
- Days to first price drop distribution
- Status transitions with counts (for_sale -> sold, for_rent -> rented)
- Price reduction velocity by property type
```

**Visualizations**:
- **Price Change Timeline**: Line chart showing avg price changes over time
- **Days to First Price Drop**: Histogram distribution
- **Status Flow Sankey**: Visual flow from initial to final status
- **Price Reduction by City Table**: Sortable with avg drop %, count

---

#### Tab 4: Tool Performance Tab (`ToolPerformanceTab.tsx`)

**Data Hook**: `useToolAnalytics.tsx`
```text
Queries:
- Completion rates by tool
- Step abandonment analysis
- Tool-to-action conversion (tool use -> inquiry)
- Input distribution (price ranges entered)
```

**Visualizations**:
- **Tool Completion Funnel**: Horizontal bar showing started vs completed per tool
- **Step Abandonment Chart**: Which step has highest drop-off
- **Tool Usage Ranking**: Bar chart of most used tools
- **Next Action Distribution**: What users do after completing a tool

---

#### Tab 5: Location Module Tab (`LocationModuleTab.tsx`)

**Data Hook**: `useLocationModuleAnalytics.tsx`
```text
Queries:
- Event type breakdown (anchor_click, travel_mode_toggle, custom_place_add)
- Most clicked anchor types
- Travel mode preferences
- Custom place categories
```

**Visualizations**:
- **Event Type Breakdown**: Pie chart
- **Anchor Type Performance**: Bar chart (orientation, daily, mobility)
- **Travel Mode Usage**: Horizontal bar (walk, drive, transit)
- **Custom Place Types**: Badge list with counts

---

#### Tab 6: Lead Quality Tab (`LeadQualityTab.tsx`)

**Data Hook**: `useLeadQualityAnalytics.tsx`
```text
Queries:
- Response time distribution (< 1hr, 1-4hr, 4-24hr, > 24hr)
- Outcome breakdown (visit_scheduled, info_provided, closed_won, closed_lost)
- Loss reason analysis
- Agent response leaderboard
```

**Visualizations**:
- **Response Time Distribution**: Histogram
- **Outcome Breakdown**: Donut chart
- **Loss Reason Analysis**: Horizontal bar chart
- **Agent Leaderboard Table**: Ranked by response time + conversion

---

#### Tab 7: Content Performance Tab (`ContentPerformanceTab.tsx`)

**Data Hook**: `useContentAnalytics.tsx`
```text
Queries:
- Content completion rates by type (blog, guide, glossary)
- Average scroll depth and active time
- Next action attribution (content -> search/tool/inquiry)
- Top performing content pieces
```

**Visualizations**:
- **Completion Rate by Type**: Bar chart
- **Content Attribution Sankey**: content -> next action flow
- **Top Content Table**: Ranked by completion + engagement score

---

#### Tab 8: Funnel Health Tab (`FunnelHealthTab.tsx`)

**Data Hook**: `useFunnelAnalytics.tsx`
```text
Queries:
- Milestone progression (% reaching each milestone)
- Drop-off points between milestones
- Milestone reach counts over time
- User segment analysis
```

**Visualizations**:
- **Milestone Funnel**: Vertical funnel visualization
- **Drop-off Chart**: Bar chart showing where users fall off
- **Milestone Trend**: Line chart of milestones reached over time

---

#### Tab 9: Performance Monitor Tab (`PerformanceMonitorTab.tsx`)

**Data Hook**: `usePerformanceAnalytics.tsx`
```text
Queries:
- Core Web Vitals averages (LCP, CLS, INP)
- Error rates by type
- Route load times by page
- Integration health status
```

**Visualizations**:
- **Core Web Vitals Cards**: Green/yellow/red thresholds
- **Error Rate Trend**: Line chart
- **Slowest Routes Table**: Top 10 by load time
- **Integration Health Status**: Success rate badges (Google Maps, geocoding)

---

#### Tab 10: Experiment Results Tab (`ExperimentResultsTab.tsx`)

**Data Hook**: `useExperimentAnalytics.tsx`
```text
Queries:
- Active experiments list
- Variant exposure counts
- Conversion rates by variant
- Statistical significance indicators
```

**Visualizations**:
- **Active Experiments Table**: Name, variants, exposure counts
- **Variant Comparison Chart**: Bar chart per experiment
- **Conversion Rate Comparison**: With confidence intervals

---

### Dashboard Integration

**File**: `src/pages/admin/AdminAnalytics.tsx`

Add 10 new tab triggers and content panels:
```text
New tabs to add after "Cities":
- Impressions, Engagement, Price Intel, Tool Perf, Location, Lead Quality, Content, Funnel, Performance, Experiments
```

**Update DataHealthCard**: Add counts for all 15+ new tracking tables

---

## Part 2: Component Integration - Wiring Tracking Hooks

### Integration Priority Matrix

| Priority | Component | Hook to Integrate | Events Tracked |
|----------|-----------|------------------|----------------|
| HIGH | PropertyCard.tsx | useImpressionTracking | Card impressions in viewport |
| HIGH | Listings.tsx | useImpressionTracking | Grid-level impression observer |
| HIGH | PropertyHero.tsx | useMicroSignalTracking | Gallery open/close, image views |
| HIGH | PropertyLocation.tsx | useLocationModuleTracking | Anchor clicks, travel mode, custom places |
| HIGH | MortgageCalculator.tsx | useToolTracking | Tool start, steps, completion |
| MEDIUM | All 10 calculators | useToolTracking | Tool usage patterns |
| MEDIUM | PropertyDetails page | usePageEngagement | Active time, scroll depth |
| MEDIUM | Blog/Guide pages | useContentEngagement | Completion, next action |
| LOW | FavoriteButton.tsx | useMicroSignalTracking | Save clicks |
| LOW | ShareButton.tsx | useMicroSignalTracking | Share method tracking |

### Detailed Component Changes

#### 1. Listings.tsx - Impression Tracking

**Current State**: Has `useSearchTracking` and `useEventTracking` but no impression tracking

**Changes**:
- Import `useImpressionTracking`
- Create IntersectionObserver for property cards
- Pass observer ref to ListingsGrid or individual cards
- Track position, page number, filters for each visible card

```text
Integration approach:
1. Create observer on mount with current search context
2. Observe each PropertyCard element
3. Batch flush impressions on scroll pause or navigation
```

---

#### 2. PropertyHero.tsx - Gallery Micro-Signals

**Current State**: No tracking on gallery interactions

**Changes**:
- Import `useMicroSignalTracking`
- Track gallery open when `setIsGalleryOpen(true)` is called
- Track image views on carousel navigation
- Track gallery close when modal closes

```text
Add tracking calls:
- handleImageClick() -> trackGalleryOpen()
- scrollPrev/scrollNext() -> trackImageView(index)
- FullscreenGallery onClose -> trackGalleryClose()
```

---

#### 3. PropertyLocation.tsx - Location Module Events

**Current State**: No tracking on location interactions

**Changes**:
- Import `useLocationModuleTracking`
- Track travel mode toggle when `setTravelMode` changes
- Track anchor card clicks
- Track custom location additions

```text
Events to track:
- setTravelMode(mode) -> trackTravelModeToggle(mode)
- CityAnchorCard onClick -> trackAnchorClick(anchorType)
- LocationSearchInput onSelect -> trackCustomPlaceAdd(type)
```

---

#### 4. MortgageCalculator.tsx (and other tools) - Tool Tracking

**Current State**: No tool run tracking

**Changes**:
- Import `useToolTracking('mortgage_calculator')`
- Track step changes when user moves between input sections
- Track calculation on "Calculate" button click
- Track completion with inputs/outputs when user finishes

```text
Integration points:
- Component mount -> startToolRun() (automatic via hook)
- Collapsible open/close -> trackStepChange('advanced_options')
- Calculate button -> trackCalculation(inputs, outputs)
- Save to profile -> completeToolRun('completed', inputs, outputs, 'save')
```

---

#### 5. PropertyDetails Page - Page Engagement

**File**: Need to identify the correct file (may be Property.tsx or similar)

**Changes**:
- Import `usePageEngagement('property', propertyId)`
- Hook automatically tracks active time, scroll depth
- No manual calls needed - hook handles everything

---

#### 6. Blog/Guide Components - Content Engagement

**Changes**:
- Import `useContentEngagement`
- Pass content type and ID
- Track completion on scroll to bottom
- Track next action on link clicks

---

### Files Summary

**New Files to Create (10 tabs + 10 hooks = 20 files)**:

```text
src/components/admin/analytics/
├── ImpressionsTab.tsx
├── EngagementDepthTab.tsx
├── PriceIntelligenceTab.tsx
├── ToolPerformanceTab.tsx
├── LocationModuleTab.tsx
├── LeadQualityTab.tsx
├── ContentPerformanceTab.tsx
├── FunnelHealthTab.tsx
├── PerformanceMonitorTab.tsx
└── ExperimentResultsTab.tsx

src/hooks/
├── useImpressionAnalytics.tsx
├── useEngagementAnalytics.tsx
├── usePriceHistoryAnalytics.tsx
├── useToolAnalytics.tsx
├── useLocationModuleAnalytics.tsx
├── useLeadQualityAnalytics.tsx
├── useContentAnalytics.tsx
├── useFunnelAnalytics.tsx
├── usePerformanceAnalytics.tsx
└── useExperimentAnalytics.tsx
```

**Files to Modify**:

```text
src/pages/admin/AdminAnalytics.tsx          - Add 10 new tabs
src/components/admin/analytics/DataHealthCard.tsx - Monitor new tables

src/pages/Listings.tsx                      - Add impression tracking
src/pages/Projects.tsx                      - Add impression tracking
src/components/property/PropertyHero.tsx    - Add gallery micro-signals
src/components/property/PropertyLocation.tsx - Add location module tracking
src/components/property/FavoriteButton.tsx  - Add save tracking
src/components/property/ShareButton.tsx     - Add share tracking

src/components/tools/MortgageCalculator.tsx - Add tool tracking
src/components/tools/PurchaseTaxCalculator.tsx
src/components/tools/RentVsBuyCalculator.tsx
src/components/tools/TrueCostCalculator.tsx
src/components/tools/TotalCostCalculator.tsx
src/components/tools/AffordabilityCalculator.tsx
src/components/tools/InvestmentReturnCalculator.tsx
src/components/tools/RentalIncomeCalculator.tsx
src/components/tools/RenovationCostEstimator.tsx
src/components/tools/NewConstructionCostCalculator.tsx
```

---

## Implementation Order

### Phase 1: Data Hooks (Foundation)
Create all 10 analytics data hooks first - these query the new tables and provide data for tabs.

### Phase 2: Admin Dashboard Tabs
Build tabs one by one, starting with highest-value:
1. Price Intelligence (market insights)
2. Tool Performance (calculator value)
3. Impressions (visibility metrics)
4. Lead Quality (agent accountability)
5. Engagement (user behavior depth)
6. Location Module (confidence engine ROI)
7. Funnel Health (conversion optimization)
8. Content (guide attribution)
9. Performance (reliability monitoring)
10. Experiments (future-proofing)

### Phase 3: Component Integration
Wire tracking hooks into components, starting with highest-traffic:
1. Listings.tsx + PropertyCard impressions
2. PropertyHero gallery tracking
3. MortgageCalculator (most used tool)
4. PropertyLocation module
5. Other calculators
6. Blog/guide pages

---

## Expected Data Flow After Implementation

```text
User browses listings  -> listing_impressions (via useImpressionTracking)
                       -> ImpressionsTab shows position performance

User views property    -> page_engagement (via usePageEngagement)
                       -> EngagementDepthTab shows scroll/time data

User uses calculator   -> tool_runs + tool_step_events (via useToolTracking)
                       -> ToolPerformanceTab shows completion funnel

User explores location -> location_module_events (via useLocationModuleTracking)
                       -> LocationModuleTab shows anchor engagement

Agent responds to lead -> lead_response_events (manual or UI integration)
                       -> LeadQualityTab shows response metrics

Price changes          -> listing_price_history (via DB trigger)
                       -> PriceIntelligenceTab shows market velocity
```

This creates a complete analytics loop from user action to admin insight.
