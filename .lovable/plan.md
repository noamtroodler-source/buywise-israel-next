
# Change Sort Dropdown Highlight from Yellow to Blue

## The Problem
When selecting a sort option (like "Price: Low to High") in the dropdown menus on Listings, Rentals, and Projects pages, the selected item shows with a yellow/amber background instead of the brand's primary blue.

## Current Styling

| Component | Line | Current Class |
|-----------|------|---------------|
| PropertyFilters.tsx | 677 | `bg-amber-400` |
| ProjectFilters.tsx | 594 | `bg-amber-100` |

## The Fix
Change both components to use blue primary color styling for selected dropdown items:

### PropertyFilters.tsx (Lines 676-678)

**Before:**
```tsx
filters.sort_by === option.value 
  ? "bg-amber-400 font-medium" 
  : "hover:bg-muted"
```

**After:**
```tsx
filters.sort_by === option.value 
  ? "bg-primary/10 text-primary font-medium" 
  : "hover:bg-muted"
```

### ProjectFilters.tsx (Lines 593-595)

**Before:**
```tsx
filters.sort_by === option.value 
  ? "bg-amber-100 text-foreground font-medium" 
  : "hover:bg-muted"
```

**After:**
```tsx
filters.sort_by === option.value 
  ? "bg-primary/10 text-primary font-medium" 
  : "hover:bg-muted"
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/filters/PropertyFilters.tsx` | Line 677: Replace `bg-amber-400` with `bg-primary/10 text-primary` |
| `src/components/filters/ProjectFilters.tsx` | Line 594: Replace `bg-amber-100 text-foreground` with `bg-primary/10 text-primary` |

## Result After Fix
- All sort dropdowns across Rentals, Buy (Properties), and Projects will highlight selected options in primary blue
- Consistent with the brand's blue-only color palette standard
- Matches the check icon color which is already using the default foreground
