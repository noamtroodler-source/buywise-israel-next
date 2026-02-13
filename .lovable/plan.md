

# Phase 4: Filters and Search Refinement

This phase replaces the placeholder "Filters coming soon" bar with the existing, fully-featured `PropertyFilters` component already built for the listings page. It also adds a Buy/Rent toggle and wires the filter bar bidirectionally with the URL-based filter state.

## What Gets Built

1. **Filter bar integration** -- The existing `PropertyFilters` component (with its City, Price, Beds/Baths, Type, More Filters popovers) gets mounted in the map search layout with `mapMode={true}`
2. **Buy/Rent toggle** -- A segmented toggle (Buy | Rent) in the filter bar, updating the URL `status` param
3. **Bidirectional filter bridge** -- Converts between the URL-param-based `useMapFilters` hook and the object-based `PropertyFilters` interface so changes flow both ways
4. **Active filter count** -- Badge on the filter bar showing how many filters are active

## Architecture

The key challenge is bridging two filter systems:
- `useMapFilters()` stores filters as URL search params (flat keys like `min_price`, `max_price`)
- `PropertyFilters` component expects/emits a `PropertyFilters` object (from `src/types/database.ts`)

The solution: build a thin adapter in `MapSearchLayout` that converts between the two representations. When a popover changes a filter, we convert the full `PropertyFilters` object back to URL params via `setMultipleFilters`.

```text
URL params <──> useMapFilters() <──> adapter <──> PropertyFilters component
                                        │
                                        ▼
                              usePaginatedProperties(mergedFilters)
```

## Changes

### Modified: `src/hooks/useMapFilters.ts`
- Add support for additional filter params that `PropertyFilters` uses: `property_types` (comma-separated), `min_bathrooms`, `min_size`, `max_size`, `features` (comma-separated), `min_parking`, `max_days_listed`, `min_floor`, `max_floor`
- Return a richer typed object so the adapter layer is minimal
- Add `setMultipleFilters` to update many params at once (already exists)

### Modified: `src/components/map-search/MapSearchLayout.tsx`
- Remove the placeholder filter bar div
- Import and render `PropertyFilters` with `mapMode={true}` and `showBuyRentToggle={true}`
- Build an adapter that:
  - Converts `useMapFilters()` output into a `PropertyFilters` object for the component
  - On `onFiltersChange`, diffs and writes changed keys back to URL via `setMultipleFilters`
  - Handles `onBuyRentChange` by setting the `status` URL param
- Pass `previewCount={totalCount}` for the "More Filters" sheet's "Show X results" button

### No new files needed
The existing `PropertyFilters` component already has full `mapMode` support including:
- Hiding sort dropdown and create-alert button (moved to list panel in Phase 2)
- Showing a "Switch to Grid" icon button (links to `/listings`)
- All filter popovers (City, Price, Beds/Baths, Property Type, More Filters)
- Mobile filter sheet via `MobileFilterSheet`

## Technical Details

- **Filter bridge pattern**: When `PropertyFilters` calls `onFiltersChange(newFilters)`, the adapter diffs against the current URL state and calls `setMultipleFilters` with only the changed keys. This prevents unnecessary URL updates and re-renders.
- **Comma-separated arrays**: `property_types` and `features` are stored in the URL as comma-separated strings (e.g., `property_types=apartment,penthouse`) and parsed back into arrays.
- **No new dependencies** -- purely wiring existing components together.
- **Mobile**: The existing `MobileFilterSheet` is automatically triggered by `PropertyFilters` on mobile viewports, so mobile filters work out of the box.
- **Filter bar height**: The `PropertyFilters` component renders as a flex row that naturally fits in the 48px slot previously occupied by the placeholder div. The border-bottom styling is applied by the wrapper.
