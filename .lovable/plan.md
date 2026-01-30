
## Reorganize Mobile Filters for Better Layout

### Current Issue
The filter elements wrap awkwardly on mobile:
- Row 1: Active/Sold toggle + City button
- Row 2: Filters button (alone, wasted space)
- Row 3: Sort dropdown + Alert bell

### Proposed Solution
Reorganize into a cleaner two-row layout:

```text
Row 1:  [ Active | Sold ]  [ City ▾ ]  [ Filters ]
Row 2:  [ ↕ Newest Listings ▾ ]       [ 🔔 ]
```

**Key changes:**
1. Keep Active/Sold toggle, City, and Filters button on the same row
2. Move Sort and Alert to a dedicated second row with space-between alignment
3. All elements in Row 1 stay compact and fit naturally

---

## Technical Implementation

### File to Modify
- `src/components/filters/PropertyFilters.tsx`

### Changes Required

**1. Restructure the wrapper container (Line 273)**

Change from a single `flex-wrap` container to a structured two-row layout for mobile:

```tsx
<div className="space-y-3">
  {/* Row 1: Main Filters */}
  <div className="flex flex-wrap gap-2 items-center">
    {/* Active/Sold Toggle */}
    {/* City Filter */}
    {/* Mobile Filters Button */}
    {/* Desktop-only filters: Price, Beds/Baths, Type, More */}
    {/* Clear button - desktop only */}
  </div>
  
  {/* Row 2: Sort & Alert */}
  <div className="flex items-center justify-between">
    {/* Sort dropdown */}
    {/* Alert button */}
  </div>
</div>
```

**2. Move Sort & Alert section outside the main flex row**

Extract the Sort & Alert section (currently lines 696-748) from the main flex container into its own row that uses `justify-between` for proper spacing.

**3. Make Clear button desktop-only**

Add `hidden sm:flex` to the Clear Filters button so it doesn't take up mobile space (mobile users can clear from the filter sheet).

### Visual Result

```text
┌─────────────────────────────────────────┐
│ [Active|Sold] [📍 City ▾] [⚙ Filters]  │  ← Row 1: compact
│ [↕ Newest Listings ▾]              [🔔] │  ← Row 2: full width
└─────────────────────────────────────────┘
```

This creates a cleaner, more organized mobile layout where:
- All filter controls are on the first row
- Sort and Alert have their own dedicated row with proper spacing
- No awkward wrapping or lonely buttons
