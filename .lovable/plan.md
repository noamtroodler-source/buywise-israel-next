

## Plan: Upgrade Agent Dashboard Performance Section

### Problem
The agent dashboard's left column uses flat, static metric cards (Live/Pending/Views/Leads) with no trend data or percentage changes. The agency dashboard uses `AgencyPerformanceInsights` which shows trend arrows, week-over-week percentages, and a polished card layout. The agent already has both a `PerformanceInsights` component and a `useMyAgentPerformance` hook — they're just not wired up.

### Changes

**`src/pages/agent/AgentDashboard.tsx`**

1. Import `useMyAgentPerformance` and `PerformanceInsights`
2. Replace the inline 4-card grid (lines 330-349) with the `PerformanceInsights` component, passing metrics from the hook
3. The `PerformanceInsights` component already matches agency style: trend arrows, percentage changes, top listing highlight, 2x2/4-col grid layout
4. Keep the `bg-muted/30 rounded-2xl p-4` wrapper to match agency's performance section
5. Align the two-column grid to use `lg:items-center` like the agency dashboard does (currently `lg:items-start`)

This is a focused swap — ~20 lines changed. All the visual parity (trends, arrows, conversion rates) comes from reusing existing components that were built but never connected.

