
# Comprehensive Analytics Dashboard Enhancement Plan

## Current State Summary

Your admin analytics dashboard at `/admin/analytics` already has **10 tabs** with substantial visualization:

### What's Currently VISIBLE in the Dashboard:

| Tab | Data Shown | Data Source |
|-----|------------|-------------|
| **Overview** | Conversion funnel, geographic analytics, views trend | `property_views`, `property_inquiries`, `favorites` |
| **User Behavior** | Sessions, pages/session, bounce rate, device breakdown, hourly activity | `user_events` table (0 records - not wired) |
| **Search Intel** | Top cities, price ranges, features, zero results, conversion | `search_analytics` table (0 records - not wired) |
| **Listing Intel** | Days on market, days to inquiry, price changes by city | `listing_lifecycle` table (0 records - triggers exist but lifecycle not populated) |
| **Advertisers** | Login frequency, actions, response rates | `advertiser_activity` table (0 records - not wired) |
| **Inventory** | Status breakdown, property types, quality metrics | `properties` table |
| **Agents** | Agent leaderboard, performance, response rates | `agents`, `properties`, `property_inquiries` |
| **Inquiries** | Pipeline, status breakdown, overdue alerts | `property_inquiries` |
| **Growth** | Period-over-period growth, cumulative trends | `profiles`, `properties`, `property_inquiries`, `property_views`, `agents` |
| **Market** | Price distribution, bedroom breakdown, city pricing | `properties` |

### What's Being TRACKED but NOT Yet Flowing:

The infrastructure exists but the frontend tracking hooks need to be integrated:

1. **`user_events`** (0 records) - Hook exists (`useEventTracking`) but not integrated
2. **`search_analytics`** (0 records) - Hook exists (`useSearchTracking`) but not integrated  
3. **`listing_lifecycle`** (0 records) - Triggers exist but need properties to be published
4. **`advertiser_activity`** (0 records) - Hook exists (`useAdvertiserTracking`) but not integrated

### What's Being TRACKED and WORKING:

- **`property_views`** (216 records) - Working
- **`property_inquiries`** (7 records) - Working
- **`recently_viewed`** (24 records) - Working
- Existing legacy tables with data

---

## Implementation Plan

### Phase 1: Wire Up Event Tracking (Critical - Gets Data Flowing)

Integrate `useEventTracking` into key components to start capturing click/engagement data:

**1.1 Property Card Clicks**
- File: `src/components/properties/PropertyCard.tsx`
- Track: card clicks, save button, share button, WhatsApp/call/email buttons

**1.2 Search & Filters**
- File: `src/components/properties/PropertyFilters.tsx` (or similar)
- File: `src/pages/Buy.tsx`, `src/pages/Rent.tsx`, `src/pages/Projects.tsx`
- Track: filter applications, sort changes, search submissions

**1.3 Contact Forms & Actions**
- File: `src/components/ContactAgentForm.tsx` (or similar)
- Track: form opens, form submissions, WhatsApp clicks, call clicks

**1.4 Navigation & Page Views**
- Already auto-tracked via `useEventTracking` useEffect
- Ensure hook is added to main `App.tsx` or layout component

**1.5 Calculator & Tool Usage**
- Files: Calculator components (`MortgageCalculator.tsx`, etc.)
- Track: calculator opens, calculations performed, results saved

### Phase 2: Wire Up Search Tracking

Integrate `useSearchTracking` to capture search behavior:

**2.1 Listings Pages**
- Files: `src/pages/Buy.tsx`, `src/pages/Rent.tsx`, `src/pages/Projects.tsx`
- Track: `trackSearchStart()` when page loads
- Track: `trackSearch()` when results are fetched
- Track: `trackSearchResultClick()` when user clicks a result

**2.2 Property/Project Cards**
- Track saves via `trackSearchResultSave()`
- Track inquiries via `trackSearchResultInquiry()`

### Phase 3: Wire Up Advertiser Tracking

Integrate `useAdvertiserTracking` into agent/developer dashboards:

**3.1 Agent Dashboard**
- File: `src/pages/agent/AgentDashboard.tsx`
- Track: `trackDashboardView()` on load
- Track: `trackListingAction()` on create/edit
- Track: `trackInquiryAction()` on inquiry view/respond

**3.2 Developer Dashboard**
- File: `src/pages/developer/DeveloperDashboard.tsx`
- Similar tracking as agent dashboard

**3.3 Login Events**
- File: Auth-related components
- Track: login events for advertiser engagement metrics

### Phase 4: Add Missing Dashboard Visualizations

Add new components to surface data not yet visible:

**4.1 New "Data Health" Card (Overview Tab)**
Show tracking status with counts from each table to monitor data quality.

**4.2 Enhance User Behavior Tab**
Add:
- UTM source/campaign breakdown
- Referrer analysis
- New vs returning sessions (if user_id present)

**4.3 Enhance Search Intelligence Tab**
Add:
- Neighborhood demand (not just cities)
- Bedroom demand breakdown
- Time-to-first-click metrics

**4.4 New "Content Engagement" Section**
Track:
- Blog post views/reads
- Calculator usage frequency
- Tool feedback summary

**4.5 New "Alerts & Notifications" Section**
Show:
- Price drop notifications sent
- Search alert triggers
- Agent notification delivery

### Phase 5: Add Real-Time Tracking Dashboard

Create a new "Live Activity" view showing:
- Active sessions (last 5 minutes)
- Recent page views stream
- Recent searches stream
- Real-time inquiry alerts

---

## Technical Implementation Details

### Files to Create:
1. `src/components/admin/analytics/DataHealthCard.tsx` - Tracking status monitor
2. `src/components/admin/analytics/ContentEngagementTab.tsx` - Blog/calculator analytics
3. `src/components/admin/analytics/LiveActivityTab.tsx` - Real-time activity stream

### Files to Modify:

**Core Integration (Phase 1-3):**
```
src/App.tsx                              - Add useEventTracking for auto page views
src/components/properties/PropertyCard.tsx - Add click/save tracking
src/components/PropertyListingCard.tsx   - Add click/save tracking
src/pages/Buy.tsx                        - Add search tracking
src/pages/Rent.tsx                       - Add search tracking  
src/pages/Projects.tsx                   - Add search tracking
src/pages/agent/AgentDashboard.tsx       - Add advertiser tracking
src/pages/developer/DeveloperDashboard.tsx - Add advertiser tracking
```

**Dashboard Enhancements (Phase 4-5):**
```
src/pages/admin/AdminAnalytics.tsx       - Add new tabs/sections
src/hooks/useAnalyticsData.tsx           - Add new query hooks
```

---

## Data Flow After Implementation

```text
User Action                    Hook Called                    Table Updated
-----------                    -----------                    -------------
Page load                  --> useEventTracking.trackEvent --> user_events
Click property card        --> useEventTracking.trackClick --> user_events
Apply filter               --> useEventTracking.trackEvent --> user_events
Search properties          --> useSearchTracking.trackSearch --> search_analytics
Click search result        --> trackSearchResultClick      --> search_analytics
Save property              --> trackSearchResultSave       --> search_analytics
Agent views dashboard      --> trackDashboardView          --> advertiser_activity
Agent creates listing      --> trackListingAction          --> advertiser_activity
Agent responds to inquiry  --> trackInquiryAction          --> advertiser_activity
Property is published      --> DB trigger                  --> listing_lifecycle
Property price changes     --> DB trigger                  --> listing_lifecycle
Property receives inquiry  --> DB trigger                  --> listing_lifecycle
Property is sold/rented    --> DB trigger                  --> listing_lifecycle
```

---

## Priority Order

1. **Highest Priority**: Wire `useEventTracking` into `App.tsx` and `PropertyCard.tsx` (immediate data flow)
2. **High Priority**: Wire `useSearchTracking` into Buy/Rent pages (demand intelligence)
3. **High Priority**: Wire `useAdvertiserTracking` into agent dashboard (advertiser insights)
4. **Medium Priority**: Add Data Health monitoring card
5. **Lower Priority**: Add Content Engagement and Live Activity tabs

---

## Expected Outcomes

After implementation:
- **User Behavior Tab** will show real session data, page flows, device breakdown
- **Search Intel Tab** will reveal what cities/prices/features users are searching for
- **Listing Intel Tab** will show how long properties take to sell by city (once lifecycle populates)
- **Advertisers Tab** will show which agents are most active and responsive
- All data flows into your admin dashboard automatically - no manual exports needed
