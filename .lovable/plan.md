

# Agency Dashboard Polish — Implementation Plan

## Changes Overview

### 1. Replace Stats Row with Inline Snapshot Strip
**File:** `src/pages/agency/AgencyDashboard.tsx`

Remove the 4-card stats row (lines 186-209) which duplicates data from quick actions and performance. Replace with a single-line horizontal strip under the header showing `122 listings · 5 agents · 30,191 all-time views · 3 pending` — compact, no cards, just text with dot separators.

### 2. Remove "Active Listings" from Performance Insights
**File:** `src/components/agency/AgencyPerformanceInsights.tsx`

Remove the "Active Listings" metric card (it's a static number, not a weekly trend — it doesn't belong in "This Week's Performance"). Keep Views, Inquiries, and Conversion Rate as a 3-column grid.

### 3. Smart Empty State for Performance
**File:** `src/components/agency/AgencyPerformanceInsights.tsx`

When all three metrics (views, inquiries, conversion) are zero, show a friendly empty state message instead of a wall of zeros: "No activity this week yet — views and inquiries will appear here as buyers discover your listings."

### 4. Compact Empty Announcements
**File:** `src/pages/agency/AgencyDashboard.tsx`

When there are no announcements, reduce to a minimal single-line display with inline "Create" button instead of a full card with header.

### 5. Move Featured Count into Quick Actions Badge
**File:** `src/pages/agency/AgencyDashboard.tsx`

The Featured quick action already shows a count. Remove the separate "Featured Summary" card from the left column (lines 219-238) since it duplicates info. If there's active spend, show it as a subtitle in the quick action card instead.

### 6. Add Subtle Visual Differentiation
**File:** `src/pages/agency/AgencyDashboard.tsx`

- Performance section: wrap in a subtle `bg-muted/30 rounded-2xl p-4` container to visually separate from quick actions
- Quick actions: add each action's `bg` color as a very subtle hover background

### 7. Mobile "New Listing" FAB
**File:** `src/pages/agency/AgencyDashboard.tsx`

Add a fixed-position `+ New Listing` floating button at bottom-right, visible only on mobile (`md:hidden`), linking to the listing creation flow. Uses primary color, 44px touch target.

## Files Modified
- `src/pages/agency/AgencyDashboard.tsx` — remove stats row, remove featured card, add snapshot strip, compact announcements, add FAB
- `src/components/agency/AgencyPerformanceInsights.tsx` — remove Active Listings metric, add empty state

## No Breaking Changes
Same routes, same data hooks, same component exports. Pure layout and presentation cleanup.

