

# Phase 5: Final Polish & Missing Features

This phase addresses the remaining items from the future ideas list, plus additional improvements discovered during review.

---

## 5A: Project Popup (instead of direct navigation)

Currently, clicking a `ProjectMarker` navigates directly to `/projects/slug`. This is jarring compared to property markers which show a popup. Add a consistent popup experience.

### 5A.1 Create MapProjectPopup component

**New file: `src/components/map-search/MapProjectPopup.tsx`**

A Leaflet `<Popup>` similar to `MapPropertyPopup` but for projects:
- Shows project name, city, status badge ("Under Construction", "Pre-Sale", etc.)
- Price range ("From X")
- A "View Project" button linking to `/projects/{slug}`
- Close button in top-right corner
- No image carousel (projects may not have images in the marker data -- keep it simple with a colored header bar using the project accent color)

### 5A.2 Wire into PropertyMap

**File: `src/components/map-search/PropertyMap.tsx`**

- Add `selectedProjectId` state (string | null)
- When a `ProjectMarker` is clicked, set `selectedProjectId` instead of navigating
- Render `<MapProjectPopup>` when `selectedProjectId` is set
- Clicking a property marker clears `selectedProjectId` and vice versa (only one popup at a time)
- Update `MapClickHandler` to also clear `selectedProjectId`

---

## 5B: Mobile City Selection Sheet

Currently the mobile city chip opens a separate dialog (`mobileCityOpen` state exists but isn't wired to anything visible). Integrate a proper city selection bottom sheet.

### 5B.1 Create MobileCitySheet component

**New file: `src/components/map-search/MobileCitySheet.tsx`**

A Vaul drawer (using existing `Sheet` or `Drawer` pattern) that:
- Shows a list of cities with property counts (reuse `get_city_property_counts` RPC)
- Each city row shows: city name + property count
- Tapping a city calls `onCitySelect(cityName)` and closes the sheet
- Has a "Clear" option to remove city filter
- Includes a "Use my location" button at the top (using existing `useGeolocation` hook)

### 5B.2 Wire into MapSearchLayout mobile layout

**File: `src/components/map-search/MapSearchLayout.tsx`**

- Import `MobileCitySheet`
- Render it with `open={mobileCityOpen}` and `onOpenChange={setMobileCityOpen}`
- Pass `onCitySelect` that calls `handleFiltersChange` with the selected city
- The existing `onCityClick={() => setMobileCityOpen(true)}` in `MobileMapFilterBar` already triggers it

---

## 5C: OG Meta Tags for Shared Map Links

When users share a map link on social media or messaging apps, it should show a meaningful preview card.

### 5C.1 Dynamic SEO for map page

**File: `src/pages/MapSearch.tsx`**

- Update `SEOHead` to include dynamic OG tags based on URL params:
  - If `city` param exists: title becomes "Properties in {City} | BuyWise Israel"
  - If `status=for_rent`: title becomes "Rentals in {City} | BuyWise Israel"
  - Description includes filter context (e.g., "Browse X properties for sale in Jerusalem")
- Add `og:image` pointing to a static map preview image (a branded fallback, since we can't generate dynamic screenshots)

---

## 5D: Neighborhood Boundaries Toggle in Layers Menu

The `NeighborhoodBoundariesLayer` is always visible when `showNeighborhoodBoundaries` is true (hardcoded to `true` in PropertyMap). Add it to the LayersMenu so users can toggle it.

### 5D.1 Add to LayersMenu

**File: `src/components/map-search/LayersMenu.tsx`**

- Add a "Neighborhoods" layer row with a `MapPin` or `Hexagon` icon
- Accept new props: `showNeighborhoodBoundaries`, `onToggleNeighborhoodBoundaries`

### 5D.2 Wire toggle in PropertyMap

**File: `src/components/map-search/PropertyMap.tsx`**

- Change `showNeighborhoodBoundaries` from hardcoded `true` to state (default `true`)
- Pass toggle callback through `MapToolbar` to `LayersMenu`

---

## 5E: List-Map Hover Sync Improvements

Currently hovering a property in the list highlights it on the map, but there's no scroll-into-view when hovering a map marker to find it in the list. While auto-scrolling was intentionally disabled (per memory), we can add a subtle "scroll to" button.

### 5E.1 "Find in list" affordance

**File: `src/components/map-search/MapPropertyPopup.tsx`**

- Add a small "Find in list" text button below the "View Details" button
- When clicked, it dispatches a custom event or calls a callback that scrolls the list panel to the matching property card

### 5E.2 Wire scroll-to in MapPropertyList

**File: `src/components/map-search/MapPropertyList.tsx`**

- Accept `scrollToPropertyId?: string | null` prop
- When `scrollToPropertyId` changes, use `scrollIntoView` on the matching card element
- The parent `MapSearchLayout` manages this state via a callback from the popup

---

## 5F: Loading & Transition Polish

### 5F.1 Skeleton loading for map markers

**File: `src/components/map-search/PropertyMap.tsx`**

- When `isFetching` is true and the map has no properties yet, show a subtle pulsing overlay text: "Loading properties..." centered on the map (instead of just the list panel loading)

### 5F.2 Smooth list transitions

**File: `src/components/map-search/MapPropertyList.tsx`**

- Add `opacity-50 pointer-events-none` to the property grid during `isFetching` (replacing the current full overlay spinner which blocks the entire panel)
- This keeps the previous results visible but dimmed, matching Zillow's behavior

### 5F.3 Mobile peek card loading state

**File: `src/components/map-search/MobileMapSheet.tsx`**

- When `isLoading`, show skeleton cards in the peek strip (3 placeholder cards with shimmer) instead of nothing

---

## Summary of Changes

| File | What changes |
|------|-------------|
| `MapProjectPopup.tsx` | NEW -- Popup for project markers with name, price range, status, and "View Project" button |
| `MobileCitySheet.tsx` | NEW -- Bottom sheet for mobile city selection with counts and geolocation |
| `PropertyMap.tsx` | Add selectedProjectId state; wire MapProjectPopup; make neighborhood boundaries toggleable; add loading overlay |
| `MapPropertyPopup.tsx` | Add "Find in list" button |
| `MapPropertyList.tsx` | Accept scrollToPropertyId prop; replace full overlay with dimmed grid during fetch |
| `MapSearchLayout.tsx` | Wire MobileCitySheet; pass scrollToPropertyId and fetch state |
| `LayersMenu.tsx` | Add "Neighborhoods" toggle row |
| `MobileMapSheet.tsx` | Add skeleton peek cards during loading |
| `MapSearch.tsx` | Dynamic OG meta tags based on URL params |

## Implementation Order

| Order | Section | Effort | Impact |
|-------|---------|--------|--------|
| 1 | 5A Project Popup | Medium | High (consistency) |
| 2 | 5B Mobile City Sheet | Medium | High (mobile UX) |
| 3 | 5F Loading Polish | Small | Medium (perceived performance) |
| 4 | 5D Neighborhood Layer Toggle | Small | Low (user control) |
| 5 | 5E Find in List | Small | Medium (discoverability) |
| 6 | 5C OG Meta Tags | Small | Low (sharing) |

