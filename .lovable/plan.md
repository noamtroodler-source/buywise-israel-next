

# Comprehensive Map Search Reinvention - Phase 4+

After reviewing the current state (Phases 1-3 completed), competitor patterns from Zillow/Redfin/Yad2, and the live app, here is a thorough plan addressing every remaining issue -- from critical bugs to strategic polish.

---

## Current State Assessment

The previous 3 phases cleaned up dead code, simplified mobile chrome, streamlined the desktop filter bar, added marker clustering, a layers menu, a "Search this area" button, and popup navigation arrows. The foundation is solid. What remains are refinements across 6 areas.

---

## Phase 4A: Critical UX Fixes

### 4A.1 Fix CityOverlay query (fetches ALL properties)
`CityOverlay.tsx` currently fetches every published property row just to count per city. This is the single biggest performance issue.

**Change:** Replace the `.select('city')` query with a grouped RPC or use Supabase's aggregation. Since Supabase JS doesn't support GROUP BY natively, create a database function:

```sql
CREATE OR REPLACE FUNCTION get_city_property_counts(p_listing_status text)
RETURNS TABLE(city text, count bigint) AS $$
  SELECT city, COUNT(*)::bigint
  FROM properties
  WHERE listing_status = p_listing_status
    AND is_published = true
    AND city IS NOT NULL
  GROUP BY city;
$$ LANGUAGE sql STABLE;
```

Then call it via `supabase.rpc('get_city_property_counts', { p_listing_status: listingStatus })`.

**Files:** Database migration + `CityOverlay.tsx`

### 4A.2 Fix MapBoundsListener not firing when searchAsMove is off
Currently when `searchAsMove` is false, `MapBoundsListener.handleMoveEnd` returns early, which means `onBoundsChange` never fires. This prevents the parent from knowing the current viewport center/zoom for URL persistence. The bounds should always update for position tracking, but property queries should be gated separately.

**Change:** Always call `onBoundsChange` but separate "should query" logic to the parent (`MapSearchLayout`) where `frozenBounds` already handles this.

**Files:** `PropertyMap.tsx` (MapBoundsListener)

### 4A.3 Empty state on map itself
When no properties are visible in viewport, users see nothing on the map and may not notice the list panel's empty state. Add a subtle floating message on the map.

**Change:** In `PropertyMap.tsx`, when `properties.length === 0` and `currentZoom >= 10` (past city overlay), render a floating pill: "No properties here. Try zooming out or adjusting filters."

**Files:** `PropertyMap.tsx`

---

## Phase 4B: Marker & Popup Polish

### 4B.1 "Recently Viewed" indicator on markers
Track visited property detail pages in localStorage. Show a subtle dot or reduced opacity on markers for properties the user has already viewed.

**Change:**
- Create a small utility `useRecentlyViewed()` hook that reads/writes property IDs to localStorage key `bw_viewed_properties` (max 200 entries, FIFO).
- Call `markViewed(propertyId)` on the property detail page mount.
- In `PropertyMarker.tsx`, accept `isViewed` prop and add a CSS class `.marker-viewed` that reduces opacity to 0.7.
- In `MarkerClusterLayer.tsx`, pass `isViewed` down.

**Files:** New `src/hooks/useRecentlyViewed.ts`, `PropertyMarker.tsx`, `MarkerClusterLayer.tsx`, property detail page

### 4B.2 Popup image carousel
The popup currently shows only the first image. Add a mini 2-3 dot carousel.

**Change:** In `MapPropertyPopup.tsx`, if `property.images?.length > 1`, show dot indicators and allow left/right swipe or arrow click to cycle images within the popup.

**Files:** `MapPropertyPopup.tsx`

### 4B.3 Project popup
Currently clicking a project marker navigates directly to `/projects/slug`. Instead, show a compact popup (similar to property popup) with project name, price range, status, and a "View Project" button -- consistent with property popups.

**Change:** Create `MapProjectPopup.tsx` and wire it into `PropertyMap.tsx` via a `selectedProjectId` state.

**Files:** New `MapProjectPopup.tsx`, `PropertyMap.tsx`

---

## Phase 4C: Mobile Refinements

### 4C.1 Swipe-to-peek horizontal cards
The peek state shows 5 cards in a horizontal scroll. Make these more Zillow-like:
- Increase card width from 240px to 280px
- Add a subtle snap scroll effect
- Show the active/selected card centered when a marker is tapped

**Files:** `MobileMapSheet.tsx`

### 4C.2 Map controls on mobile
The `MapToolbar` renders identically on mobile and desktop. On mobile:
- Hide the keyboard shortcuts button (already done)
- Make touch targets 44px minimum (currently 40px on mobile -- bump to 44px)
- Move the toolbar lower to avoid overlap with the `MobileMapFilterBar`

**Files:** `MapToolbar.tsx`

### 4C.3 Mobile filter sheet: add city selection
Currently `MobileMapFilterBar` has a city chip but `onCityClick` opens a separate dialog. The city selector should open within the `MobileFilterSheet` as its first section, or as a dedicated bottom sheet with the list of cities.

**Files:** `MobileMapFilterBar.tsx`, `MapSearchLayout.tsx` (wire city selection sheet)

---

## Phase 4D: URL State & Sharing

### 4D.1 Persist active layers in URL
Save `layers` param in URL (comma-separated: `train,heatmap,anglo,saved`). When sharing a link, the recipient sees the same layers enabled.

**Change:** Read/write a `layers` URL param in `PropertyMap.tsx` state initialization and update it when toggles change.

**Files:** `PropertyMap.tsx`

### 4D.2 Persist panel split ratio
Save the `ResizablePanel` default size in `localStorage` so returning users get their preferred layout width.

**Files:** `MapSearchLayout.tsx`

### 4D.3 Better share experience
The current share copies the URL. Enhance:
- Include a preview card (Open Graph meta tags) so shared links show a property count and map preview in social/messaging apps.
- The share button toast should show the URL being copied.

**Files:** `MapToolbar.tsx` (toast message), `SEOHead` updates in `MapSearch.tsx`

---

## Phase 4E: Rent-Specific Adjustments

### 4E.1 Rental marker styling
Currently buy and rent markers look identical (white pill). Rental markers should have a subtle visual distinction:
- Add a small "R" badge or a different border color (e.g., a subtle green-tinted border) so users scanning the map can distinguish listing types at a glance.
- Alternatively, show "/mo" suffix on rental price markers (already done in `PropertyMarker.tsx`).

**Change:** Keep the `/mo` suffix but also add a thin colored left-border or dot to rental markers.

**Files:** `PropertyMarker.tsx`, `src/index.css`

### 4E.2 Rental-specific filters visibility
When in rent mode, some filters are less relevant (e.g., property condition "new construction"). Hide or deprioritize these in the filter bar/sheet.

**Files:** `PropertyFilters.tsx` / `MobileFilterSheet.tsx`

---

## Phase 4F: Performance & Polish

### 4F.1 Infinite scroll in desktop list
Replace the "Load More" button with intersection observer-based infinite scroll.

**Change:** Add an `IntersectionObserver` at the bottom of the property list that triggers `loadMore()` when visible.

**Files:** `MapPropertyList.tsx`

### 4F.2 Debounce hover events
When moving the mouse quickly across many markers, rapid hover callbacks cause unnecessary re-renders. Add a 50ms debounce to `onPropertyHover`.

**Files:** `MapSearchLayout.tsx`

### 4F.3 Clean up dead CSS
Remove unused CSS classes from `src/index.css`:
- `.property-marker.for-sale`, `.property-marker.for-rent` (replaced by pill-style markers)
- `.cluster-marker.small/medium/large` with `.cluster-price` (clusters now use simple count-only style)

**Files:** `src/index.css`

---

## Implementation Order

| Order | Section | Effort | Impact |
|-------|---------|--------|--------|
| 1 | 4A.1 CityOverlay query | Small | High (performance) |
| 2 | 4A.2 Bounds listener fix | Small | Medium (UX correctness) |
| 3 | 4A.3 Map empty state | Small | Medium |
| 4 | 4F.1 Infinite scroll | Small | Medium |
| 5 | 4F.3 Dead CSS cleanup | Small | Low (code hygiene) |
| 6 | 4B.1 Recently viewed | Medium | Medium |
| 7 | 4B.2 Popup carousel | Medium | Medium |
| 8 | 4B.3 Project popup | Medium | Medium |
| 9 | 4C.1 Mobile peek cards | Small | Medium |
| 10 | 4C.2 Mobile toolbar | Small | Medium |
| 11 | 4C.3 Mobile city selection | Medium | Medium |
| 12 | 4D.1 Layer URL persistence | Small | Low |
| 13 | 4D.2 Panel ratio persistence | Small | Low |
| 14 | 4E.1 Rental marker styling | Small | Low |
| 15 | 4F.2 Hover debounce | Small | Low |

---

## Technical Summary

```text
Database Migration:
  - Create function get_city_property_counts(p_listing_status text)

Files to CREATE:
  - src/hooks/useRecentlyViewed.ts
  - src/components/map-search/MapProjectPopup.tsx

Files to MODIFY:
  - src/components/map-search/CityOverlay.tsx (use RPC instead of fetching all rows)
  - src/components/map-search/PropertyMap.tsx (bounds fix, empty state, project popup, layer URL persistence)
  - src/components/map-search/PropertyMarker.tsx (isViewed prop, rental styling)
  - src/components/map-search/MarkerClusterLayer.tsx (pass isViewed)
  - src/components/map-search/MapPropertyPopup.tsx (image carousel)
  - src/components/map-search/MapPropertyList.tsx (infinite scroll via IntersectionObserver)
  - src/components/map-search/MobileMapSheet.tsx (card sizing, snap scroll)
  - src/components/map-search/MapToolbar.tsx (mobile touch targets)
  - src/components/map-search/MapSearchLayout.tsx (panel persistence, hover debounce, city sheet)
  - src/index.css (dead CSS removal, rental marker styles, viewed marker styles)
  - src/pages/PropertyDetail.tsx (mark as viewed)
```

Each sub-phase (4A through 4F) is independently shippable. I recommend starting with 4A (critical fixes) then 4F.1 (infinite scroll) as they have the highest impact-to-effort ratio.

