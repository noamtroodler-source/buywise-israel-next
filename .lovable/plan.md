

# Phase 1: Resilience & Polish

Three improvements to make the agent dashboard robust and pleasant for new and existing agents.

---

## 1. Widget-Level Error Boundaries

**Problem**: If any single query (performance, properties, leads, blog) throws, the entire dashboard crashes.

**Solution**: Create a `WidgetErrorBoundary` component — a lightweight error boundary that wraps each dashboard card/widget individually. On error, it renders a compact inline error state with a retry button instead of crashing the page.

**Files**:
- **New**: `src/components/shared/WidgetErrorBoundary.tsx` — Class component extending `ErrorBoundary` pattern but with a compact card-sized fallback (icon + "Failed to load" + Retry button). Matches BuyWise rounded-2xl / primary color standards.
- **Edit**: `src/pages/agent/AgentDashboard.tsx` — Wrap each major section in `<WidgetErrorBoundary>`:
  - Performance Insights card
  - Recent Properties card
  - Stale Listings / Changes Requested sidebar cards
  - Onboarding Checklist
- **Edit**: `src/pages/agent/AgentAnalytics.tsx` — Wrap each analytics widget (FunnelMetrics, InquiryPieChart, HourlyActivityChart, PropertyEngagementTable).

---

## 2. Empty State Handling

**Problem**: New agents with zero listings see blank areas, 0/0 conversion rates, and empty charts that look broken.

**Solution**: Add meaningful empty states with clear CTAs.

**Changes**:
- **Edit**: `src/components/agent/PerformanceInsights.tsx` — When all metrics are zero, show a friendly "No data yet" state with a prompt to create their first listing. The 0.0% conversion display will show "—" instead of "0.0%" when there are zero views.
- **Edit**: `src/pages/agent/AgentDashboard.tsx`:
  - When `properties.length === 0`, replace the Recent Properties card with a "Create Your First Listing" empty state card with a CTA button linking to `/agent/properties/new`.
  - Snapshot strip: show a friendlier display when all values are 0 (e.g., "Get started by adding your first listing").
- **Edit**: `src/components/agent/analytics/FunnelMetrics.tsx` — When views/saves/inquiries are all 0, show "No funnel data yet — views will appear once your listings go live."
- **Edit**: `src/components/agent/analytics/HourlyActivityChart.tsx` — Already handles empty state (good).
- **Edit**: `src/components/agent/analytics/InquiryPieChart.tsx` — Already handles empty state (good).
- **Edit**: `src/components/agent/analytics/PropertyEngagementTable.tsx` — Already handles empty state (good).

---

## 3. Per-Widget Loading Skeletons

**Problem**: Currently the entire dashboard shows a single full-screen spinner (line 113-121) while `profileLoading || propertiesLoading` is true. The performance data loads independently but shows nothing until ready. This feels slow and blocks the whole page.

**Solution**: Remove the full-page spinner. Render the dashboard layout immediately with skeleton placeholders per section.

**Changes**:
- **New**: `src/components/agent/DashboardSkeletons.tsx` — Export skeleton components:
  - `SnapshotStripSkeleton` — row of 4 pulsing text placeholders
  - `QuickActionsSkeleton` — 6 rounded-2xl skeleton cards in grid
  - `PerformanceSkeleton` — card with 4 skeleton metric boxes
  - `RecentPropertiesSkeleton` — card with 3 skeleton rows (image + text)
  - `SidebarCardSkeleton` — generic card skeleton for sidebar
- **Edit**: `src/pages/agent/AgentDashboard.tsx`:
  - Remove the full-page `Loader2` spinner block (lines 113-121)
  - Instead, render the full layout structure and conditionally show skeletons vs real content per section:
    - Header: show skeleton name/agency if `profileLoading`
    - Snapshot strip: show `SnapshotStripSkeleton` if `propertiesLoading`
    - Quick actions: show `QuickActionsSkeleton` if `profileLoading`
    - Performance card: show `PerformanceSkeleton` if `performanceLoading`
    - Recent properties: show `RecentPropertiesSkeleton` if `propertiesLoading`
  - All skeletons use the existing `Skeleton` component from `src/components/ui/skeleton.tsx` with `rounded-2xl` to match the design system.

---

## Summary of Files Touched

| File | Action |
|------|--------|
| `src/components/shared/WidgetErrorBoundary.tsx` | Create |
| `src/components/agent/DashboardSkeletons.tsx` | Create |
| `src/pages/agent/AgentDashboard.tsx` | Edit (remove spinner, add skeletons, error boundaries, empty states) |
| `src/components/agent/PerformanceInsights.tsx` | Edit (zero-data empty state) |
| `src/components/agent/analytics/FunnelMetrics.tsx` | Edit (improve zero-data message) |

