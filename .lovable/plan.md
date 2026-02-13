
# Phase 2: Property Cards + List Panel with Data

This phase wires up real property data to the list panel and introduces a new Zillow-style vertical image-first card designed specifically for the map view.

## What Gets Built

1. **MapListCard** -- A new vertical, image-first property card component optimized for the 40% side panel
2. **MapListPanel upgrade** -- Connects to real data via `usePaginatedProperties`, adds sorting, infinite scroll, loading skeletons, and proper empty/error states
3. **MapSearchLayout wiring** -- Passes map bounds and URL filters into the data pipeline so the list responds to map movement

## Card Design (MapListCard)

Each card follows the Zillow vertical layout:

```text
+-------------------------------+
|  [Image 16:10 aspect ratio]   |
|  Heart (top-right overlay)    |
|  Badge (top-left: "Just       |
|   Listed" / "Price Drop")     |
|  Carousel dots (bottom)       |
+-------------------------------+
|  ₪2,500,000                   |
|  3 bds | 2 ba | 120 sqm      |
|  Herzliya Pituach, Herzliya   |
|  Apartment                    |
+-------------------------------+
```

Features:
- Image carousel on hover (prev/next arrows appear, dots at bottom)
- FavoriteButton overlay (top-right, reuses existing component)
- Status badges: "Just Listed" (<=3 days), "Price Drop" with percentage, "Featured" sparkle
- Price with original price strikethrough when reduced
- Pipe-separated stats: beds, baths, sqm
- Neighborhood + city on next line
- Property type label (subtle, muted)
- Entire card is a Link to `/property/:id`
- Hover: subtle `translateY(-2px)` lift with shadow increase
- Uses existing `useFormatPrice` and `useFormatArea` from PreferencesContext

## List Panel Upgrades

**Header**:
- Left: "X results" bold count (from `totalCount`)
- Right: Sort dropdown (functional) with options: Newest, Price Low-High, Price High-Low, Size, Rooms

**Card Grid**:
- 2-column CSS grid (`grid-cols-2`) with `gap-4` padding
- Infinite scroll via intersection observer sentinel at bottom
- Loading state: 6 skeleton cards (matching card aspect ratio)
- Fetching indicator: subtle top progress bar

**Empty State** (kept from Phase 1):
- MapPin icon, "No properties yet", instructional text

## Data Flow

```text
URL params ──> useMapFilters() ──> PropertyFilters
                                        │
Map bounds (moveend) ──────────────────>│
                                        ▼
                              usePaginatedProperties(filters)
                                        │
                              ┌─────────┴──────────┐
                              ▼                    ▼
                        totalCount            properties[]
                              │                    │
                              ▼                    ▼
                     MapListPanel header    MapListCard grid
```

- `MapSearchLayout` merges URL filter state from `useMapFilters()` with live map bounds into a `PropertyFilters` object
- Passes that to `usePaginatedProperties` which handles pagination, count, and `keepPreviousData` for smooth UX
- The `listing_status` filter comes from the URL `status` param (for_sale, for_rent)
- Sort changes update the URL via `setFilter('sort_by', value)`

## Files

### New: `src/components/map-search/MapListCard.tsx`
- Vertical image-first card component
- Props: `property: Property`
- Uses `useFormatPrice`, `useFormatArea` from PreferencesContext
- Uses `FavoriteButton` from existing component
- Uses `PropertyThumbnail` for fallback image handling
- Image carousel with hover arrows and dot indicators
- Link wrapping to `/property/:id`

### Modified: `src/components/map-search/MapListPanel.tsx`
- Accept `properties`, `totalCount`, `isLoading`, `isFetching`, `hasNextPage`, `loadMore`, `sortBy`, `onSortChange` props
- Render 2-column grid of MapListCards
- Intersection observer for infinite scroll
- Sort dropdown in header (Select component)
- Skeleton loading state
- Keep empty state when no results

### Modified: `src/components/map-search/MapSearchLayout.tsx`
- Import and call `useMapFilters()` to get filters and setFilter
- Track map bounds in state, merge with URL filters into a `PropertyFilters` object (from `src/types/database`)
- Pass merged filters to `usePaginatedProperties()`
- Pass all data props down to MapListPanel
- Pass sort handler that calls `setFilter('sort_by', value)`

## Technical Details

- No new dependencies -- reuses `usePaginatedProperties`, `useFormatPrice`, `useFormatArea`, `FavoriteButton`, `PropertyThumbnail`
- `keepPreviousData` in the paginated hook ensures the list doesn't flash empty when bounds change
- Infinite scroll uses a simple `IntersectionObserver` on a sentinel div
- Image carousel uses local state with `currentImageIndex`, showing prev/next on hover (same pattern as existing `PropertyCard`)
- Cards use `memo` for performance since the list can have 24+ items
