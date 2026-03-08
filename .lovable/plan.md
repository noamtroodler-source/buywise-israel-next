

## Neighborhood Search — Implemented ✅

All changes from the plan have been implemented:

1. **`useNeighborhoodNames` hook** — Shared hook fetching neighborhood names per city + `useAllNeighborhoods` for cross-city search.
2. **`useMapFilters`** — Added `neighborhoods` URL param (comma-separated).
3. **`useProperties`** — Added `neighborhoods[]` array filter via `.in('neighborhood', ...)` in both count and listing queries.
4. **`PropertyFilters` city popover** — Shows `NeighborhoodSelector` multi-select after city is chosen. Button label updates to show selected neighborhoods.
5. **`MobileFilterSheet`** — Same `NeighborhoodSelector` in mobile Location section.
6. **`CitySearchInput`** — Autocomplete now searches neighborhoods too, grouped under "Neighborhoods" with "Name, City" format. Selecting navigates with both city + neighborhood params.
7. **`NeighborhoodChips`** — Map chips now trigger listing filter via `onFilterNeighborhood` callback.
8. **`MapSearchLayout`** — Wires neighborhood filter between map chips and URL params. Includes neighborhoods in clear-all.
9. **`ActiveFilterChips`** — Dismissible chip for active neighborhood filters.
