

# Phase J: Dashboard Quick Search & Activity Feed

## Overview

Add two new sections to the Agency Dashboard (`AgencyDashboard.tsx`):
1. A compact **recent listings table** with an inline search bar (top 5 listings, filterable by title/address/agent)
2. A **recent team activity feed** showing new listings and inquiries from team members

## Changes

### 1. New hook: `src/hooks/useAgencyTeamActivity.tsx`

Fetch recent activity for a given agency:
- Recent properties created by agency agents (from `properties` joined with `agents` to get agent name)
- Recent inquiries on agency properties (from `property_inquiries` joined with `properties`)
- Merge, sort by `created_at` desc, limit to 10
- Return typed `TeamActivityItem[]` with `id`, `type` ('new_listing' | 'inquiry'), `title`, `description`, `timestamp`, `relativeTime`
- Uses `formatDistanceToNow` from date-fns (already in project)
- `refetchInterval: 60000`

### 2. New component: `src/components/agency/AgencyTeamActivityFeed.tsx`

Compact card with:
- Header: "Team Activity" with Activity icon
- ScrollArea (max ~240px) listing activity items
- Each item: icon (Home for listings, MessageSquare for inquiries), title, description, relative time
- Empty state: "No recent activity"
- Loading skeleton (3 items)

### 3. New component: `src/components/agency/DashboardListingsPreview.tsx`

Compact card with:
- Header: "Recent Listings" with link to `/agency/listings`
- Search input (filters by title, address, or agent name client-side)
- Small table: Title, Agent, Status, Views — top 5 filtered results from `useAgencyListingsManagement`
- Status badges matching existing `statusConfig`
- Empty/loading states

### 4. Update: `src/pages/agency/AgencyDashboard.tsx`

- Import the two new components
- Add them in a new two-column grid row between the Performance/Announcements section and the Mobile FAB
- Left: `DashboardListingsPreview` (3 cols)
- Right: `AgencyTeamActivityFeed` (2 cols)
- Pass `agency.id` to both

## Files touched

| File | Change |
|------|--------|
| `src/hooks/useAgencyTeamActivity.tsx` | New hook — fetch recent team activity |
| `src/components/agency/AgencyTeamActivityFeed.tsx` | New component — activity feed card |
| `src/components/agency/DashboardListingsPreview.tsx` | New component — searchable mini listings table |
| `src/pages/agency/AgencyDashboard.tsx` | Import & render new components |

