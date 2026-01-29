

# Simplify Mobile Filter UI

## Overview
Streamline the mobile filter experience across all listing pages (Properties for Sale, Rentals, Projects) by consolidating most filters behind a single "Filters" button that opens a full-screen sheet, leaving only the essential City filter visible by default.

---

## Current State

Currently on mobile, the listings pages show multiple filter buttons that wrap to multiple rows:
- Active/Sold toggle (for_sale only)
- City
- Price
- Beds/Baths
- Type
- More Filters
- Sort dropdown
- Create Alert button
- Quick Filter Chips row

This creates visual clutter and requires scrolling to access all options.

---

## Proposed Mobile Layout

| Element | Visibility | Location |
|---------|-----------|----------|
| Active/Sold toggle | Always visible | Left side |
| City | Always visible | Inline |
| **Filters** button | Always visible | Inline (opens full-screen sheet) |
| Sort | Always visible | Right side |
| Alert button | Always visible | Right side |
| Quick Filter Chips | Below filter bar | Unchanged |

**Total visible elements**: 4-5 buttons in a single row (vs. current 6+ that wrap)

---

## Changes Required

### 1. PropertyFilters.tsx - Mobile Layout

**Wrap desktop filter buttons in mobile conditional rendering:**

```tsx
// Desktop: Show all individual filter popovers
{!isMobile && (
  <>
    {/* Price, Beds/Baths, Type buttons */}
  </>
)}

// Mobile: Single "Filters" button that opens full-screen sheet
{isMobile && (
  <Button onClick={() => setMobileFiltersOpen(true)}>
    <SlidersHorizontal />
    {activeFilterCount > 0 ? `Filters (${activeFilterCount})` : 'Filters'}
  </Button>
)}
```

**Elements that remain visible on mobile:**
- Active/Sold toggle (unchanged)
- City filter popover (unchanged) 
- New consolidated "Filters" button (replaces Price, Beds/Baths, Type, More Filters)
- Sort dropdown (unchanged)
- Alert button (unchanged)

### 2. MobileFilterSheet.tsx - Enhancements

Add missing filter sections from "More Filters" to ensure feature parity:
- Bathrooms selector
- Rental-specific filters (availability, pets policy)
- Parking, Year Built, Floor range
- Condition

### 3. ProjectFilters.tsx - Mobile Layout

Apply same pattern:
- Show City, new "Filters" button, Sort, Alert
- Hide Status, Beds/Baths, Price, Developer, Year filter buttons on mobile
- Move all hidden filters into a ProjectMobileFilterSheet

### 4. New: ProjectMobileFilterSheet.tsx

Create a project-specific mobile filter sheet containing:
- Status
- Price Range
- Beds/Baths
- Completion Year
- Developer

---

## Technical Details

### Active Filter Count Badge

Display count of active filters on the mobile "Filters" button:

```tsx
const activeFilterCount = useMemo(() => {
  let count = 0;
  if (filters.min_price || filters.max_price) count++;
  if (filters.min_rooms || filters.min_bathrooms) count++;
  if (filters.property_types?.length) count++;
  if (filters.min_size || filters.max_size) count++;
  if (filters.features?.length) count++;
  if (filters.max_days_listed) count++;
  // Rental-specific
  if (filters.available_now || filters.available_by) count++;
  if (filters.allows_pets?.length) count++;
  return count;
}, [filters]);
```

### Sheet Content Structure

The MobileFilterSheet already has sections for:
- Location (city search)
- Price Range (slider)
- Rooms
- Property Type
- Amenities
- Size
- Listing Age

Additional sections to add:
- Bathrooms
- Rental-specific (conditionally rendered)
- Parking
- Floor range
- Year built

### CSS/Layout

Mobile filter bar will use:
```tsx
<div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
  {showSoldToggle && <ActiveSoldToggle />}
  <CityPopover />
  <FiltersButton /> {/* NEW - opens full sheet */}
  <div className="flex-1" /> {/* Spacer */}
  <SortDropdown />
  <AlertButton />
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/filters/PropertyFilters.tsx` | Conditionally hide Price/Beds/Type buttons on mobile, add "Filters" button that opens MobileFilterSheet |
| `src/components/filters/MobileFilterSheet.tsx` | Add bathroom section, rental-specific filters, ensure all "More Filters" options are included |
| `src/components/filters/ProjectFilters.tsx` | Same pattern - hide individual filters on mobile, add unified "Filters" button |
| `src/components/filters/ProjectMobileFilterSheet.tsx` | **New file** - Full-screen filter sheet for Projects page |

---

## User Experience

**Before**: User sees 6+ buttons, potentially wrapping to 3 rows, must tap multiple times to access different filters

**After**: 
1. User sees clean single row: `[Active/Sold] [City v] [Filters (2)] ... [Sort v] [Bell]`
2. Tapping "Filters" opens full-screen sheet with ALL filter options
3. Quick Filter Chips below provide one-tap presets (unchanged)
4. More screen space for actual listings

---

## Summary

This change reduces cognitive load on mobile by consolidating 4-5 filter buttons into 1, while maintaining full filter functionality through the existing MobileFilterSheet pattern. The City filter remains separate since it's the most commonly used filter and benefits from quick access.

