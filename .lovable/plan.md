

# Commute Time Filter (Phase 1)

## Overview
Add a "Commute to" filter that lets users filter properties by max drive time to Tel Aviv or Jerusalem, using the commute data already stored in the `cities` table. Zero API cost, zero new dependencies.

## How It Works
1. User selects a destination (Tel Aviv or Jerusalem) and a max commute time (15/30/45/60 min)
2. The app queries the `cities` table to find all cities within that commute time
3. Properties are filtered client-side to only show listings in qualifying cities
4. A commute badge appears on property cards showing the drive time

## UI Design

The filter appears as a new section in both desktop "More Filters" popover and mobile filter sheet, placed after "Listing Age":

```text
  Commute
  -------
  Destination:   [Tel Aviv]  [Jerusalem]
  Max time:      [Any] [15] [30] [45] [60] min
```

- Pill-style buttons matching existing filter patterns (rounded-full, same sizing)
- Selecting a destination + time activates the filter
- "Any" clears the commute filter
- When active, the filter button shows a badge count like other filters

## Files to Change

### 1. `src/types/database.ts` - PropertyFilters interface
Add two new optional fields:
- `commute_destination?: 'tel_aviv' | 'jerusalem'`
- `max_commute_minutes?: number`

### 2. `src/hooks/useCommuteCities.ts` (new file)
A small hook that:
- Takes a destination and max minutes
- Queries the `cities` table filtering by `commute_time_tel_aviv` or `commute_time_jerusalem`
- Returns a list of qualifying city names
- Cached via React Query (city data rarely changes)

### 3. `src/hooks/useProperties.tsx` - useProperties and usePropertyCount
Add commute filtering logic:
- When `commute_destination` and `max_commute_minutes` are set, first fetch qualifying city names from the cities table
- Then add `.in('city', qualifyingCities)` to the property query
- This replaces any existing city filter when commute is active

### 4. `src/components/filters/PropertyFilters.tsx` - Desktop filters
Add a "Commute" section inside the "More Filters" popover:
- Destination toggle (Tel Aviv / Jerusalem)
- Time pills: Any, 15 min, 30 min, 45 min, 60 min
- Include in `resetMoreFilters` clear logic
- Include in active filter count

### 5. `src/components/filters/MobileFilterSheet.tsx` - Mobile filters
Same commute section, placed after "Listing Age":
- Destination toggle + time pills
- Follows existing section styling with Car icon

### 6. `src/hooks/useMapFilters.ts` - URL persistence
Add `commute_dest` and `max_commute` URL params so the commute filter persists in shared links.

### 7. `src/components/map-search/MobileMapFilterBar.tsx` - Active filter count
Include commute filter in the `countActiveFilters` function.

## Technical Notes

- The cities table already has `commute_time_tel_aviv` (integer, minutes) and `commute_time_jerusalem` (integer, minutes) for 20+ cities
- Jerusalem commute data is sparse (only ~6 cities have values) -- the UI will show available cities count when Jerusalem is selected so users know what to expect
- No database migrations needed -- all data already exists
- The commute filter works alongside other filters (price, rooms, etc.) but overrides the city filter when active (you're filtering by commute radius, not a single city)
- Properties in cities without commute data are excluded when commute filter is active (conservative approach -- only show what we can verify)

