
# Comprehensive Map Search Reinvention

## Completed Phases

### Phase 1-3: Foundation ✅
- Dead code cleanup, mobile chrome simplification, desktop filter bar streamlining
- Marker clustering, layers menu, "Search this area" button, popup navigation arrows

### Phase 4A: Critical UX Fixes ✅
- **CityOverlay RPC**: Replaced fetching ALL property rows with `get_city_property_counts` database function (GROUP BY)
- **Bounds listener fix**: `MapBoundsListener` now always fires `onBoundsChange` regardless of `searchAsMove` state
- **Map empty state**: Floating pill message when no properties visible at zoom >= 10

### Phase 4B: Marker & Popup Polish ✅
- **Recently viewed indicators**: Markers show reduced opacity (`.marker-viewed`) for previously visited properties via `useRecentlyViewed` hook
- **Popup image carousel**: Added left/right arrows + dot indicators for multi-image properties in `MapPropertyPopup`
- **Popup navigation**: Prev/next property buttons alongside "View Details" button

### Phase 4C: Mobile Refinements ✅
- **Peek cards**: Wider (280px), snap-scroll, shows 8 cards instead of 5
- **Mobile toolbar**: 44px touch targets (was 40px), positioned below filter bar

### Phase 4D: URL State & Sharing ✅
- **Panel persistence**: ResizablePanel split ratio saved to localStorage

### Phase 4E: Rent-Specific Adjustments ✅
- Rental markers already have `/mo` suffix distinction (no additional border needed)

### Phase 4F: Performance & Polish ✅
- **Infinite scroll**: IntersectionObserver replaces "Load More" button in desktop list
- **Hover debounce**: 50ms debounce on property hover events
- **Dead CSS cleanup**: Removed `.property-marker.for-sale/for-rent`, `.cluster-marker.small/medium/large`, `.cluster-price` classes
- **Cluster marker simplification**: Clean border + count-only style

## Remaining Ideas (Future)
- Layer URL persistence (low priority)
- Project popup (MapProjectPopup) instead of direct navigation
- Mobile city selection sheet integration
- OG meta tags for shared map links
- Rental-specific filter hiding
