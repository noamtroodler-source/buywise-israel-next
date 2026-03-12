

## Plan: Reinvent Agent Dashboard to Match Agency Dashboard Design

### Problem
The Agent Dashboard (`AgentDashboard.tsx`) is a long, vertically stacked page with a bulky gradient header, scattered status cards, large quick action cards, and an inline "Homepage Exposure" info card. It feels dated compared to the clean, compact Agency Dashboard which uses a snapshot strip, icon-grid quick actions, two-column performance layout, and mobile FAB.

### Design Changes

**1. Compact Header** (matches agency pattern)
- Remove the gradient hero banner
- Use the same flat `flex` header: icon + name/subtitle on left, action buttons on right
- Show "Agent Dashboard" subtitle, verified badge if active
- Keep Settings, Analytics, New Listing, Add Blog buttons but move to compact icon row

**2. Snapshot Strip** (new — matches agency)
- Inline dot-separated stats: `X live · X drafts · X pending · X total views`
- Replace the 5-column status cards grid entirely

**3. Quick Actions Grid** (redesign to match agency 3x2 icon grid)
- 6 compact icon tiles in `grid-cols-3 sm:grid-cols-6`: My Listings, Leads, Analytics, Blog, Settings, Public Profile
- Standardized `min-h-[96px]` tiles with icon + label, badge support
- Replace the current large 3-column cards with descriptions

**4. Two-Column Performance + Activity Layout** (new)
- Left (3/5): Performance Insights wrapped in `bg-muted/30 rounded-2xl p-4` — reuse existing `PerformanceInsights` component with data from `useMyAgentPerformance`
- Right (2/5): Stack of contextual cards:
  - Stale listings alert (if any)
  - Changes requested alert (if any)
  - Homepage Exposure card (condensed)
  - Recent Properties (top 3, compact)

**5. Priority Alerts** (keep but streamline)
- Keep approval celebration banners (single + batch) — already good
- Keep pending verification alert
- Move stale/changes-requested into the right column instead of standalone banners

**6. Onboarding Checklist** — keep as-is, already conditional

**7. Mobile FAB** (new — matches agency)
- Fixed bottom-right `+ New Listing` FAB on mobile, same spring animation

**8. Remove**
- The gradient header banner
- The 5-column status cards section
- The large 3-column quick actions with descriptions
- The large "Recent Properties" full-width card at the bottom

### Files to Edit

1. **`src/pages/agent/AgentDashboard.tsx`** — Full rewrite of the JSX layout (~400 lines changed). Keep all existing hooks, state, and logic. Restructure the template to match agency dashboard patterns.

2. **`src/components/agent/NotificationBell.tsx`** — Verify it exists and works (agent equivalent of `AgencyNotificationBell`)

No new components needed — reuse existing `PerformanceInsights`, `OnboardingChecklist`, and hooks.

### Layout Structure (top to bottom)
```text
┌─────────────────────────────────────────────┐
│ [←] [icon] Agent Name  ··· [⚙] [📊] [+ New]│  ← compact header
├─────────────────────────────────────────────┤
│ 4 live · 2 drafts · 1 pending · 342 views  │  ← snapshot strip
├─────────────────────────────────────────────┤
│ 🎉 Approval banners (if any)               │  ← priority alerts
│ ⚠ Verification pending (if applicable)     │
├─────────────────────────────────────────────┤
│ Onboarding checklist (if not dismissed)     │
├──────┬──────┬──────┬──────┬──────┬──────────┤
│ List │ Leads│ Stats│ Blog │ Sets │ Profile  │  ← quick actions grid
├──────┴──────┴──────┴──────┴──────┴──────────┤
│ ┌─────────────────┐ ┌────────────────┐      │
│ │ Performance     │ │ Stale alert    │      │
│ │ (3/5 width)     │ │ Changes alert  │      │
│ │ Views/Inquiries │ │ Homepage info  │      │
│ │ Listings/Conv.  │ │ Recent Props   │      │
│ └─────────────────┘ └────────────────┘      │
├─────────────────────────────────────────────┤
│                          [+ FAB] (mobile)   │
└─────────────────────────────────────────────┘
```

