

# Layout Cleanup: Consolidate Sort and Alert into Results Row

## Summary

Move the **Sort dropdown** ("Newest Listings") and **Create Alert button** from the filter bar down to the results count row, and remove the ViewToggle from PropertyFilters (since it's already in the results row).

---

## Current Layout (Desktop)

```text
┌────────────────────────────────────────────────────────────────┐
│ Filter Bar:                                                    │
│ [Active/Sold] [City ▼] [Price ▼] [Beds ▼] [Type ▼] [More ▼]   │
│         ... Sort ▼  🔔  [Grid | Map]  ← User wants to remove  │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Results Row:                                                   │
│ Showing 24 of 156 properties       [Grid | Map] ← Duplicate   │
└────────────────────────────────────────────────────────────────┘
```

## Proposed Layout (Desktop)

```text
┌────────────────────────────────────────────────────────────────┐
│ Filter Bar:                                                    │
│ [Active/Sold] [City ▼] [Price ▼] [Beds ▼] [Type ▼] [More ▼]   │
│                                              ← Cleaner, no    │
│                                                utility actions │
└────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│ Results Row:                                                   │
│ Showing 24 of 156 properties    Sort ▼  🔔  [Grid | Map]      │
│                                 ↑ Moved here                   │
└────────────────────────────────────────────────────────────────┘
```

---

## Changes

### 1. Remove ViewToggle from PropertyFilters
**File:** `src/components/filters/PropertyFilters.tsx`

- Remove the ViewToggle component from the desktop utility actions section (around line 744-745)
- This was creating a duplicate since the Listings page already renders its own ViewToggle in the results row

### 2. Update Listings.tsx Results Row
**File:** `src/pages/Listings.tsx`

Expand the results count row to include:
- **Property count** (left side, as before)
- **Sort dropdown** (right side, matching the sort popover style from PropertyFilters)
- **Create Alert button** (icon-only with tooltip)
- **ViewToggle** (already there)

### 3. Update PropertyFilters Props
Since PropertyFilters will no longer handle sort and alert in the desktop view for the grid page, we need to:
- Keep the mobile sort behavior unchanged (mobile already has its own sort row)
- Remove the desktop sort dropdown when used on the grid page (can be controlled via a prop or just removed)

---

## Technical Details

### PropertyFilters.tsx Changes (Lines ~677-746)

Remove from the `ml-auto` desktop utility section:
- Sort popover with "Newest Listings"
- Create Alert button
- ViewToggle

Keep only:
- Clear Filters button (if filters are active)

### Listings.tsx Changes (Lines ~267-279)

Expand the results row:
```tsx
<div className="flex items-center justify-between mb-4">
  {/* Property count - left */}
  <p className="text-sm text-muted-foreground">
    Showing {properties.length} of {totalCount} properties
  </p>
  
  {/* Utility actions - right */}
  {!isMobile && (
    <div className="flex items-center gap-2">
      {/* Sort dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="h-8 gap-1 px-2">
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span className="text-sm">{sortLabel}</span>
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </PopoverTrigger>
        {/* Sort options... */}
      </Popover>
      
      {/* Create Alert - icon only */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={() => setShowAlertDialog(true)}
            className="h-8 w-8 rounded-full bg-primary"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Create search alert</TooltipContent>
      </Tooltip>
      
      {/* View Toggle */}
      <ViewToggle activeView="grid" size="sm" />
    </div>
  )}
</div>
```

---

## Impact

- **Grid page (Listings.tsx)**: Cleaner filter bar with all utility actions consolidated in one place below
- **Map page**: May need similar treatment or can keep current layout (TBD based on preference)
- **Mobile**: No changes - mobile already has its own layout for sort/alert

