

# Phase 3: Mobile & Responsiveness

Audit and fix layout issues at ~1000px and below across all agent dashboard pages.

---

## Issues Found

1. **Quick Actions Grid** (`AgentDashboard.tsx` line 337): Uses `grid-cols-3 sm:grid-cols-6` — at 640-1023px, 6 tiny columns are cramped. Should be `grid-cols-3 md:grid-cols-6` so tablets get 3 columns.

2. **Two-Column Layout** (`AgentDashboard.tsx` line 365): Uses `lg:grid-cols-5` which only kicks in at 1024px. At 768-1023px (tablet), everything stacks vertically making the sidebar cards feel disconnected. Should use `md:grid-cols-5` to activate the 2-column layout earlier.

3. **Properties Table** (`AgentProperties.tsx` lines 207-362): 8-column table on mobile/tablet requires horizontal scrolling. On screens below `md` (768px), switch to a stacked card layout instead of a table — each listing as a compact card showing image, title, status, price, and action buttons.

4. **Analytics Listing Performance** (`AgentAnalytics.tsx` lines 248-278): Stats row (`views/saves/inquiries/conv`) gets cramped on mobile. The `hidden sm:block` on conversion is good, but the remaining 3 stat columns plus the image+title still overflow on small screens. Wrap stats below the title on mobile.

5. **Filter bar** (`AgentProperties.tsx` lines 157-175): Select triggers have fixed `w-[140px]` which doesn't adapt well. Use `w-full sm:w-[140px]`.

6. **Dashboard header actions** (`AgentDashboard.tsx` lines 190-219): "Public Page" button is `hidden sm:inline-flex` which is correct. The icon buttons row is fine.

---

## Changes

### File: `src/pages/agent/AgentDashboard.tsx`
- **Line 337**: Change `grid-cols-3 sm:grid-cols-6` → `grid-cols-3 md:grid-cols-6` for quick actions
- **Line 365**: Change `lg:grid-cols-5` → `md:grid-cols-5` for the two-column performance+sidebar layout  
- **Line 365**: Also change `lg:col-span-3` → `md:col-span-3` and `lg:col-span-2` → `md:col-span-2`
- **Line 365**: Change `lg:items-center` → `md:items-center`

### File: `src/pages/agent/AgentProperties.tsx`
- **Lines 207-362**: Add a mobile card view that renders below `md` breakpoint, hiding the table. Each card shows: thumbnail, title/city, status badge, price, and action buttons in a compact layout. The existing table gets `hidden md:block`.
- **Lines 157-175**: Change select trigger widths to `w-full sm:w-[140px]`

### File: `src/pages/agent/AgentAnalytics.tsx`
- **Lines 248-278**: On the detailed listing performance rows, make the stats wrap below the title on small screens by changing the flex layout to `flex-col sm:flex-row` with stats in a grid below

---

## Summary

| File | Changes |
|------|---------|
| `src/pages/agent/AgentDashboard.tsx` | Fix breakpoints: quick actions grid + two-column layout |
| `src/pages/agent/AgentProperties.tsx` | Add mobile card view for listings, fix filter widths |
| `src/pages/agent/AgentAnalytics.tsx` | Fix listing performance row wrapping on mobile |

