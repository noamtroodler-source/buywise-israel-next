
# Consolidate Property Filter Layout to Single Row

## Problem
Currently on the Buy/Rent listings pages, the "Newest Listings" sort dropdown and "Create Alert" button sit on a **second row** below the main filter buttons (Active/Sold, City, Price, Beds/Baths, Type, More).

The user wants these controls moved to the **same row** as the other filters, positioned to the **far right** — matching how the Projects listing page is structured.

---

## Current vs Target Layout

### Current Layout (Property Listings)
```text
┌──────────────────────────────────────────────────────────────────────────┐
│ [Active|Sold] [City ▾] [Price ▾] [Beds/Baths ▾] [Type ▾] [More] [Clear]  │
├──────────────────────────────────────────────────────────────────────────┤
│ ↕ Newest Listings ▾    [🔔 Create Alert]                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Target Layout (Matching Projects)
```text
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [Active|Sold] [City ▾] [Price ▾] [Beds/Baths ▾] [Type ▾] [More] [Clear]  ↕ Newest ▾ │ [🔔 Create Alert]
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Technical Changes

### File: `src/components/filters/PropertyFilters.tsx`

**1. Remove the second row wrapper**

The current structure has:
- `<div className="space-y-3">` wrapping two rows
- Row 1: `<div className="flex flex-wrap gap-2 items-center">` for filters
- Row 2: `<div className="flex items-center ...">` for Sort & Alert

**2. Move Sort & Create Alert into Row 1**

Add a `ml-auto` container at the end of Row 1 that holds the Sort and Create Alert controls — exactly like ProjectFilters lines 610-656.

**3. Update mobile handling**

On mobile, the current setup shows Sort and Create Alert in Row 2 with `justify-between`. Since mobile already has Create Alert as a circular bell icon inline with filters, we just need to keep Sort separate for mobile (perhaps still on its own row or inline as space allows).

---

## Code Changes Summary

### Lines to Modify in `PropertyFilters.tsx`:

**A. Change outer wrapper from `space-y-3` to single flex row (around line 273)**

From:
```tsx
<div className="space-y-3">
  {/* Row 1: Main Filters */}
  <div className="flex flex-wrap gap-2 items-center">
    ...filters...
  </div>

  {/* Row 2: Sort & Alert */}
  <div className={cn("flex items-center", ...)}>
    ...sort & alert...
  </div>
</div>
```

To:
```tsx
<div className="flex flex-wrap gap-2 items-center">
  {/* All filters in one row */}
  ...filters...
  
  {/* Clear button */}
  ...
  
  {/* Sort & Create Alert pushed to right on desktop */}
  {!isMobile && (
    <div className="flex items-center gap-2 ml-auto">
      {/* Sort dropdown */}
      <div className="flex items-center gap-1">
        <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
        <Popover>...</Popover>
      </div>
      
      {/* Create Alert */}
      {onCreateAlert && (
        <Button>Create Alert</Button>
      )}
    </div>
  )}
</div>

{/* Mobile: Sort dropdown on its own row */}
{isMobile && (
  <div className="flex items-center justify-between mt-3">
    <div className="flex items-center gap-1">
      <ArrowUpDown />
      <Popover>Sort</Popover>
    </div>
  </div>
)}
```

**B. Keep mobile layout sensible**

Mobile already shows:
- Row 1: City, Filters button, Bell icon for Create Alert
- Row 2: Sort dropdown

This makes sense for mobile (limited horizontal space), so we'll preserve the separate row for Sort on mobile only.

---

## Visual Result

### Desktop (after change)
```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Active|Sold] [City ▾] [$ Price ▾] [⊞ Beds/Baths ▾] [🏠 Type ▾] [⚙ More] [Clear]     ↕ Newest Listings ▾ │ [🔔 Create Alert] │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Mobile (unchanged)
```text
┌───────────────────────────────────────────────┐
│ [📍 City ▾] [⚙ Filters (2)] [🔔]              │
├───────────────────────────────────────────────┤
│ ↕ Newest Listings ▾                           │
└───────────────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/filters/PropertyFilters.tsx` | Restructure to single row on desktop with Sort & Alert at far right via `ml-auto` |

---

## Implementation Notes

1. **Matching the ProjectFilters pattern**: Reference lines 610-656 of ProjectFilters.tsx which shows the exact pattern:
   - Wrapper with `ml-auto`
   - ArrowUpDown icon + Sort Popover
   - Create Alert Button

2. **Preserve mobile behavior**: Keep the Sort dropdown on its own row for mobile since horizontal space is limited

3. **No functional changes**: This is purely a layout restructure — all filter logic remains the same
