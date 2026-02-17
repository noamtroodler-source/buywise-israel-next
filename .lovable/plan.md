

# Phase 6: Boost Analytics Dashboard for Agents and Developers

## Overview
Phases 2-5 built the full monetization pipeline: subscriptions, credits, boost activation, and boost rendering. Phase 6 gives agents and developers visibility into how their boosts are performing -- showing ROI on credits spent, comparing boosted vs organic performance, and helping them decide when to re-boost.

## What Gets Built

### 1. Boost Performance Analytics Hook
A new `useBoostAnalytics` hook that aggregates performance data for an entity's active and past boosts -- views gained during boost periods, inquiries received, saves, and credit spend.

### 2. Boost Analytics Tab on Agent Analytics Page
A new "Boosts" tab on `/agent/analytics` showing:
- Summary cards: Total credits spent, active boosts count, total boost impressions, average ROI
- Per-boost performance table: Each boost with its product type, target listing, duration, views/saves/inquiries during the boost window, and credits spent
- Boost vs organic comparison: A chart showing engagement metrics for boosted periods vs non-boosted periods
- Boost timeline: Visual timeline of when boosts were active across listings

### 3. Boost Analytics Tab on Developer Analytics Page
Same as above but scoped to developer projects on `/developer/analytics`.

### 4. Quick Boost Stats on Dashboard Cards
Small inline stats on the agent/developer dashboard property/project cards showing boost performance at a glance (e.g., "Boosted: +42 views" or "No active boost").

### 5. Re-boost Prompt
When a boost expires, show a prompt on the listing card suggesting re-boosting based on performance data (e.g., "Your last boost brought 38 extra views. Boost again?").

---

## Technical Details

### New Hook: `useBoostAnalytics`

```text
src/hooks/useBoostAnalytics.ts

function useBoostAnalytics(entityType: 'agency' | 'developer', entityId: string)
  -> Returns { 
    totalCreditsSpent: number,
    activeBoostCount: number,
    completedBoostCount: number,
    boostDetails: BoostAnalyticsItem[],
    isLoading: boolean
  }

Each BoostAnalyticsItem:
  - boostId, productName, productSlug
  - targetId, targetType, targetName
  - startsAt, endsAt, isActive
  - creditCost
  - viewsDuringBoost, savesDuringBoost, inquiriesDuringBoost
    (computed by querying property_views/favorites/inquiries 
     WHERE created_at BETWEEN starts_at AND ends_at)
```

### Agent Analytics Page Modification

```text
src/pages/agent/AgentAnalytics.tsx

Add a tab bar at the top: "Overview" | "Boosts"
- "Overview" tab shows the existing analytics content
- "Boosts" tab shows the new BoostAnalyticsPanel component
```

### Developer Analytics Page Modification

```text
src/pages/developer/DeveloperAnalytics.tsx

Same tab structure: "Overview" | "Boosts"
```

### New Component: `BoostAnalyticsPanel`

```text
src/components/billing/BoostAnalyticsPanel.tsx

Shared between agent and developer analytics pages.
Props: entityType, entityId

Content:
1. Summary row (4 cards):
   - Total Credits Spent (sum of all boost credit costs)
   - Active Boosts (count of currently active)
   - Completed Boosts (count of expired)
   - Avg Views per Boost (mean views during boost windows)

2. Boost Performance Table:
   - Columns: Listing, Boost Type, Duration, Status, Views, Saves, Inquiries, Cost
   - Each row is a past or current boost
   - Status badge: Active (green), Expired (gray), with time remaining/ago

3. Credits Spend Over Time Chart (Recharts bar chart):
   - Monthly breakdown of credits spent on boosts
   - Helps users see spending patterns

4. Empty state when no boosts have been used yet:
   - Friendly message with CTA to boost a listing
```

### Dashboard Card Enhancement

```text
src/pages/agent/AgentDashboard.tsx
src/pages/developer/DeveloperDashboard.tsx

On each property/project card in the dashboard listing:
- If listing has an active boost: show small "Boosted" badge with remaining days
- If listing had a recent expired boost (within 7 days): show "Re-boost?" prompt
- Both use existing useActiveBoosts hook data
```

### Database Queries (no schema changes needed)

All analytics data is computed from existing tables:
- `active_boosts` -- boost periods and credit costs (via joined visibility_products)
- `property_views` -- views during boost windows
- `favorites` -- saves during boost windows  
- `inquiries` -- inquiries during boost windows
- `credit_transactions` -- total spend tracking

### File Structure

```text
New files:
  src/hooks/useBoostAnalytics.ts          -- Aggregates boost performance data
  src/components/billing/BoostAnalyticsPanel.tsx  -- Shared analytics panel component

Modified files:
  src/pages/agent/AgentAnalytics.tsx       -- Add "Boosts" tab
  src/pages/developer/DeveloperAnalytics.tsx -- Add "Boosts" tab
  src/pages/agent/AgentDashboard.tsx       -- Add boost status to property cards
  src/pages/developer/DeveloperDashboard.tsx -- Add boost status to project cards
```

### Rendering Flow

```text
Agent clicks "Analytics" -> sees tab bar [Overview | Boosts]
  -> Clicks "Boosts" tab
  -> useBoostAnalytics fires with agent's entity data
  -> Fetches all boosts for entity, joins with visibility_products for names/costs
  -> For each boost, queries views/saves/inquiries within the boost time window
  -> Renders summary cards + performance table + spend chart
  -> Agent sees which boosts drove the most engagement and at what cost
```

## What Is NOT in Phase 6
- Automated boost recommendations (AI-powered "you should boost this listing")
- A/B testing of boost effectiveness
- Comparative benchmarks against other agents/developers
- Email notifications when boosts expire

