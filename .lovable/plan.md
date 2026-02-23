

# Add Saved Locations as Commute Destinations

## Overview
Add user's saved locations (e.g., "Parents House") as selectable commute destinations alongside Tel Aviv and Jerusalem in the commute filter. Since saved locations are arbitrary coordinates (not cities with pre-computed commute times), we'll use straight-line distance as a proxy for drive time.

## How It Works
1. If a user is logged in and has saved locations, those appear as additional destination pills below Tel Aviv/Jerusalem
2. When a saved location is selected, we calculate straight-line distance from each property to the saved location's coordinates
3. We apply a rough drive-time estimate (using ~40 km/h average Israeli driving speed) to filter properties within the selected max commute time
4. This filtering happens client-side since saved location coordinates don't map to the `cities` table columns

## UI Changes

The destination section expands to show saved locations:

```text
Commute
-------
Destination:
  [Tel Aviv]  [Jerusalem]           <-- existing, unchanged
  [Parents House]  [Office]         <-- new row, from saved locations
Max time:  [Any] [15] [30] [45] [60] min
```

- Saved location pills use smaller text + an icon from the location's saved icon type (Home, Briefcase, Heart, etc.)
- Only shown when user is logged in and has saved locations
- If no saved locations exist, the section looks exactly as it does today

## Technical Approach

### 1. `src/types/database.ts` - Expand commute_destination type
Change `commute_destination` from `'tel_aviv' | 'jerusalem'` to `'tel_aviv' | 'jerusalem' | string` to support saved location IDs (prefixed with `saved:` e.g. `saved:abc123`).

### 2. `src/hooks/useCommuteCities.ts` - Handle saved location destinations
When `commute_destination` starts with `saved:`, skip the cities table query and return `null` -- the filtering will happen client-side instead.

### 3. `src/hooks/usePaginatedProperties.tsx` - Client-side distance filtering for saved locations
When commute destination is a saved location:
- Skip the `.in('city', cityNames)` server filter
- After fetching properties, filter client-side using Haversine distance formula
- Convert max commute minutes to approximate km (using ~40 km/h average)
- Filter properties whose straight-line distance is within that radius

### 4. `src/components/filters/PropertyFilters.tsx` - Desktop commute UI
- Import `useSavedLocations` and `useAuth`
- After the Tel Aviv/Jerusalem pills, render a second row of pills for each saved location
- Use the location's icon (from `getLocationIcon`) before the label
- Set `commute_destination` to `saved:${location.id}` when selected

### 5. `src/components/filters/MobileFilterSheet.tsx` - Mobile commute UI
Same changes as desktop: add saved location pills below the city destinations.

### 6. `src/hooks/useMapFilters.ts` - URL support
The `commute_dest` URL param already supports arbitrary strings, so `saved:abc123` will persist in the URL without changes.

### 7. New utility: `src/lib/utils/haversine.ts`
A small pure function for calculating distance between two lat/lng points, used for the client-side filtering.

## Important Notes
- Saved location commute filtering is approximate (straight-line distance with a speed multiplier), not exact driving directions. This is clearly a Phase 1 approach and can be upgraded to use a routing API later.
- The existing Tel Aviv / Jerusalem city-level filtering remains unchanged and is more accurate since it uses pre-computed drive times.
- Properties without lat/lng coordinates will be excluded when a saved location filter is active.
- The saved location filter integrates with the drawn polygon filter -- both can be active simultaneously.
