

# Rename "Inquiry Analytics" → "Analytics" and "Leads" → "Analytics"

## Overview

The user wants to simplify the naming since the page shows more than just inquiry data - it includes views, saves, and overall engagement metrics. Renaming to simply "Analytics" better reflects the content.

---

## Changes

### 1. `src/pages/agent/AgentLeads.tsx`

**Line 72** - Update page title:

```text
Before:
<h1 className="text-2xl font-bold">Inquiry Analytics</h1>

After:
<h1 className="text-2xl font-bold">Analytics</h1>
```

---

### 2. `src/pages/agent/AgentDashboard.tsx`

**Line 141** - Update quick action card:

```text
Before:
{ title: 'Leads', desc: 'Manage buyer inquiries', icon: Users, href: '/agent/leads', badge: leadStats?.new },

After:
{ title: 'Analytics', desc: 'View engagement and inquiries', icon: BarChart3, href: '/agent/leads', badge: leadStats?.new },
```

This also changes the icon from `Users` to `BarChart3` (which is already imported on line 4) to better match the analytics theme.

---

## Visual Result

**Agent Dashboard Quick Actions:**
```text
Before:                              After:
┌────────────────────┐              ┌────────────────────┐
│ 👥 Leads           │      →       │ 📊 Analytics       │
│ Manage buyer       │              │ View engagement    │
│ inquiries          │              │ and inquiries      │
└────────────────────┘              └────────────────────┘
```

**Analytics Page Header:**
```text
Before:                              After:
┌────────────────────────┐          ┌────────────────────────┐
│ 📊 Inquiry Analytics   │    →     │ 📊 Analytics           │
│ See how buyers are...  │          │ See how buyers are...  │
└────────────────────────┘          └────────────────────────┘
```

---

## Note on Routes

The URL path `/agent/leads` will remain unchanged. Changing URLs would break any existing bookmarks or notification links. The route path is internal - only the user-facing labels are being updated.

---

## Summary

| File | Line | Change |
|------|------|--------|
| `AgentLeads.tsx` | 72 | "Inquiry Analytics" → "Analytics" |
| `AgentDashboard.tsx` | 141 | Title: "Leads" → "Analytics", Desc: updated, Icon: Users → BarChart3 |

