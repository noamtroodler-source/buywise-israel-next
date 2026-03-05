

# Add Neighborhood Search Across the Platform

## Current State
- **Database**: Properties have a `neighborhood` column. Cities table has `neighborhoods` JSON with names and boundary coords.
- **Backend queries**: `useProperties` already filters by `filters.neighborhood` (single) via `ilike`. The `PropertyFiltersType` already has `neighborhood` and `neighborhoods` fields.
- **UI gap**: The City filter popover only shows cities — no neighborhood selection. The homepage `CitySearchInput` only searches cities. The map `NeighborhoodChips` only pan/zoom the map but don't filter listings.

## Plan

### 1. Upgrade the City Filter Popover (PropertyFilters.tsx)
**After** a city is selected, show a second section: "Neighborhoods" with multi-select checkboxes pulled from the `cities.neighborhoods` JSON for that city. Selected neighborhoods get stored in `filters.neighborhoods` (already exists in the type). The popover button label changes from just "City" to "City · Neighborhood" or "Tel Aviv · Neve Tzedek" when a neighborhood is selected.

- Add a `useNeighborhoodNames(cityName)` hook that fetches neighborhood names from the `cities` table (reuse logic from `NeighborhoodChips`).
- Inside the City popover, render a searchable multi-select list of neighborhoods below the city list when a city is selected.
- "Clear" resets both city and neighborhoods.

### 2. Wire Neighborhoods into Query Filtering (useProperties.tsx)
Currently only `filters.neighborhood` (singular) is used. Add support for `filters.neighborhoods` (array):
```
if (filters?.neighborhoods?.length) {
  query = query.in('neighborhood', filters.neighborhoods);
} else if (filters?.neighborhood) {
  query = query.ilike('neighborhood', `%${filters.neighborhood}%`);
}
```
Apply same logic in both the count query and the listing query.

### 3. Upgrade Homepage CitySearchInput
Add neighborhoods to the autocomplete results. When user types, search both city names AND neighborhood names. Display results grouped:
- **Cities** section: matching cities
- **Neighborhoods** section: matching neighborhoods (showing "Neighborhood, City" format)

When a neighborhood is selected, navigate to `/listings?city=CityName&neighborhoods=NeighborhoodName` (or `/map?...`).

This requires building a flat list of all `{neighborhood, city}` pairs from the cities table (a new hook or extend `useCities`).

### 4. Make Map NeighborhoodChips Actually Filter
Currently `NeighborhoodChips.onSelect` only pans the map. Update the parent (`PropertyMap` → `MapSearchLayout`) to also call `setFilter('neighborhoods', name)` in the URL params when a chip is selected, so listings actually filter by neighborhood.

### 5. Add Neighborhood to URL Params (useMapFilters.ts)
Add `neighborhood` / `neighborhoods` param parsing to `useMapFilters` so map search supports deep-linking like `/map?city=Tel+Aviv&neighborhoods=Neve+Tzedek`.

### 6. Active Filter Chips
When a neighborhood filter is active, show it as a dismissible chip alongside other active filters (city, price, etc.) in the filter bar.

## Files to Modify
- `src/hooks/useProperties.tsx` — add `neighborhoods[]` array filter
- `src/hooks/useMapFilters.ts` — add `neighborhoods` URL param
- `src/components/filters/PropertyFilters.tsx` — add neighborhood multi-select inside City popover
- `src/components/filters/MobileFilterSheet.tsx` — same neighborhood selection for mobile
- `src/components/home/CitySearchInput.tsx` — add neighborhood results to autocomplete
- `src/components/map-search/NeighborhoodChips.tsx` — wire to actual listing filter
- `src/components/map-search/PropertyMap.tsx` — pass filter callback to chips
- New: `src/hooks/useNeighborhoodNames.ts` — shared hook to get neighborhood names for a city

