

# Agency Dashboard Design Polish

## Changes

### 1. Branded Initials Avatar Fallback
**File:** `src/pages/agency/AgencyDashboard.tsx`

Replace the generic `Building2` icon in the header with a smart avatar: if `agency.logo_url` exists, show the logo image; otherwise, generate initials from the agency name (e.g., "NT" for "Noam Troodler") with a gradient background (`from-primary to-primary/70`). The avatar is 48px rounded-2xl.

### 2. Distinct Metric Card Colors
**File:** `src/components/agency/AgencyPerformanceInsights.tsx`

Each `MetricCard` currently uses `bg-primary/10` for all icons. Change to:
- Views: `bg-blue-500/10` + `text-blue-600`
- Inquiries: `bg-emerald-500/10` + `text-emerald-600`  
- Conversion: `bg-amber-500/10` + `text-amber-600`

Add `iconColor` and `iconBg` props to `MetricCard`.

### 3. Larger Quick Action Icons
**File:** `src/pages/agency/AgencyDashboard.tsx`

Bump icon container from `p-2.5` to `p-3` (48px effective) and icons from `h-5 w-5` to `h-6 w-6`.

### 4. Warm Empty Announcements
**File:** `src/pages/agency/AgencyDashboard.tsx`

Replace the single-line "No announcements" with a small card containing motivational copy: "Keep your team aligned — share updates, wins, or reminders" with a styled "New Announcement" button.

### 5. Better Snapshot Separators
**File:** `src/pages/agency/AgencyDashboard.tsx`

Replace the `·` dot separator with a more visible vertical bar using a styled `span` with `w-px h-3.5 bg-border` for clean visual rhythm.

### 6. Performance Wrapper Border
**File:** `src/pages/agency/AgencyDashboard.tsx`

Add `border border-border/30` to the `bg-muted/30` wrapper around performance insights.

### 7. Tighter Two-Column Layout
**File:** `src/pages/agency/AgencyDashboard.tsx`

Change from `lg:grid-cols-5` (3+2) to `lg:grid-cols-3` (2+1) for a more compact desktop layout.

## Files Modified
- `src/pages/agency/AgencyDashboard.tsx`
- `src/components/agency/AgencyPerformanceInsights.tsx`

