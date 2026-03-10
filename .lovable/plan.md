

# Linked City + Neighborhood Filter (Resale, Rental, Projects)

## Current State
- **PropertyFilters** (resale/rental): Has a single "City" popover that contains both city list and a `NeighborhoodSelector` that only appears after a city is selected. Neighborhoods are scoped to the selected city only.
- **ProjectFilters**: Has a "City" popover with no neighborhood support at all.
- **MobileFilterSheet**: Same pattern as PropertyFilters.
- **ProjectMobileFilterSheet**: No neighborhood support.

## Proposed Design: Linked Dual-Filter

Replace the single "City" popover with **two side-by-side filter buttons**: **City** and **Neighborhood**.

### Behavior

**City button/popover:**
- Search + list of all 25 cities
- Selecting a city updates the city filter (clears neighborhoods)
- "Use my location" stays here

**Neighborhood button/popover:**
- Always has a search input at the top
- **If a city is selected**: Shows only that city's neighborhoods (multi-select checkboxes)
- **If no city is selected**: Search is global across all cities; results grouped by city (e.g., "Rehavia — Jerusalem"). Selecting a neighborhood from any city auto-sets the city filter to that neighborhood's city.
- Button label shows: "Neighborhood" (default), single name, or "X areas" count

**Cross-sync:**
- Selecting a neighborhood from a different city → city filter updates to match
- Changing city → clears neighborhood selection
- Clearing city → clears neighborhoods

### Files to Change

1. **`src/components/filters/NeighborhoodSelector.tsx`** — Rewrite as a standalone `NeighborhoodFilterPopover` component:
   - Accepts `cityName` (optional), `allNeighborhoods` data, `selectedNeighborhoods`, callbacks
   - When no city: global search with city-grouped results
   - When city set: scoped list with multi-select
   - On selecting a neighborhood from a different city, calls `onCityChange`

2. **`src/components/filters/PropertyFilters.tsx`** — Split the single city popover into two buttons:
   - City popover (simplified, no neighborhood section)
   - Neighborhood popover (new, using the rewritten component)
   - Wire cross-sync logic

3. **`src/components/filters/ProjectFilters.tsx`** — Add `neighborhoods` to `ProjectFiltersType`, add the same dual City + Neighborhood buttons

4. **`src/components/filters/MobileFilterSheet.tsx`** — Update location section to show City and Neighborhood as separate sections with same linked behavior

5. **`src/components/filters/ProjectMobileFilterSheet.tsx`** — Add neighborhood filtering matching the desktop ProjectFilters

6. **`src/hooks/usePaginatedProjects.tsx`** + **`src/hooks/useMapProjects.tsx`** — Apply neighborhood filter to project queries (filter by `neighborhood` column or joined unit neighborhoods)

7. **`src/hooks/useNeighborhoodNames.ts`** — Already has both `useNeighborhoodNames` (per-city) and `useAllNeighborhoods` (global). No changes needed.

