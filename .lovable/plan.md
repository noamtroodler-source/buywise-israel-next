

# Comprehensive Map Search Reinvention Plan

This plan addresses every layer of the map experience -- from high-level layout and mobile UX down to marker polish and performance -- organized into 4 phases that build on each other.

---

## What's Wrong Today (Audit Findings)

After a full code audit and visual inspection, here are the core issues:

**Layout and Structure:**
- Desktop uses `PropertyFilters` (the full listings filter bar) at the top, which is designed for the listings page and feels heavy/redundant for a map view
- The MapFiltersBar component exists but is NOT used anywhere -- it was replaced by PropertyFilters but never cleaned up (dead code)
- Mobile has THREE separate view modes (List / Split / Map) with a clunky 3-button toggle bar, plus MobileQuickFilters AND PropertyFilters stacked together -- eating ~150px of vertical space before any content appears
- The `MapFilterDialog` component is also orphaned (only used from the unused MapFiltersBar)

**Filter Clutter:**
- On mobile, PropertyFilters + MobileQuickFilters + view toggle = 3 rows of chrome before the user sees a single property
- Desktop filter bar includes Sort, which is less relevant on a map (spatial search, not list ordering)
- Quick amenity chips (Balcony, Elevator, etc.) in the unused MapFiltersBar duplicate what's in the "More Filters" popover

**Map Controls:**
- The toolbar (top-right) is a dense 2x2 grid that's hard to parse at a glance
- The "Search as I move" checkbox concept exists but there's no visible toggle on the map itself -- it's managed silently
- The Heatmap toggle exists in the toolbar but was removed from the visible button grid (the `showPriceHeatmap` state exists but the Thermometer button is gone)
- The "Saved Locations" toggle button was also removed from the toolbar but the feature still works

**Mobile UX:**
- The MobileMapSheet has good bones (peek/half/full with swipe gestures) but the "Split" mode creates a separate sheet that competes with the floating Map/List pill
- The 3-way toggle (List/Split/Map) is non-standard -- Zillow/Redfin use a simple 2-way toggle pill floating over the map

**Dead/Redundant Code:**
- `MapFiltersBar.tsx` -- 306 lines, completely unused
- `MapFilterDialog.tsx` -- 207 lines, only referenced by unused MapFiltersBar
- `MapHoverPopup.tsx` -- exists in directory but not imported anywhere
- `MapEmptyState.tsx` -- exists but never rendered (empty state is handled inline in MapPropertyList)
- `CommuteFilter.tsx` -- imported in unused MapFiltersBar, not in the live filter bar

**Popup/Card Issues:**
- The MapPropertyPopup (on-map card when clicking a marker) is compact and good, but the "View Details" button navigates away immediately -- no way to browse multiple properties without losing map context
- The property list uses full `PropertyCard` component in compact mode, which is heavier than needed for a side panel

**Performance:**
- All properties re-render markers when ANY property is hovered (the memo comparator helps, but the parent still maps over the full array each render)
- CityOverlay fetches ALL properties just to count by city -- should use a grouped query or materialized count

---

## Phase 1: Clean House (Remove Dead Code, Simplify Mobile Chrome)

**Goal:** Reduce code surface area and reclaim screen real estate, especially on mobile.

### 1.1 Delete unused components
- Delete `MapFiltersBar.tsx` (unused)
- Delete `MapFilterDialog.tsx` (only used by MapFiltersBar)
- Delete `MapHoverPopup.tsx` (not imported anywhere)
- Delete `MapEmptyState.tsx` (empty state handled in MapPropertyList)
- Clean up any orphaned imports

### 1.2 Simplify mobile to 2-state toggle
- Replace the 3-button (List/Split/Map) toggle with a single floating pill over the map (like Zillow's "List" / "Map" toggle)
- Default to map view with the peek sheet (current MobileMapSheet with peek/half/full is great -- keep it)
- Remove the separate "list-only" and "split" modes -- the sheet handles all of this via its 3 height states
- This removes one full row of chrome from mobile

### 1.3 Slim down mobile filter chrome
- On mobile map view, replace the full `PropertyFilters` component with a compact single-row bar:
  - Buy/Rent toggle pill (left)
  - City name (if selected, tappable to change)
  - Filter button with count badge (right, opens MobileFilterSheet)
- Remove `MobileQuickFilters` from the map page -- the full filter sheet already covers these
- Net result: go from ~150px of filter chrome to ~48px

### 1.4 Remove dead CSS classes
- Clean up unused `.property-marker.for-sale`, `.property-marker.for-rent` etc. (replaced by pill-style markers)

---

## Phase 2: Desktop Layout Polish

**Goal:** Make the desktop filter bar map-appropriate and improve the property list panel.

### 2.1 Streamlined desktop filter bar
- Keep using `PropertyFilters` but pass a new `compact` or `mapMode` prop that:
  - Hides the Sort dropdown (sorting is irrelevant on a spatial map)
  - Hides the "Create Alert" button from the inline bar (move it to a floating action or the list panel header)
  - Removes the View Toggle from the filter bar (it's redundant -- user is already on the map page, they can use browser back or a small icon to go to grid)
- Add a small "Switch to Grid" icon button in the filter bar instead of the full ViewToggle component

### 2.2 Improved property list panel header
- Replace the plain "X properties" header with a richer header:
  - Property count + "in [City Name]" context
  - Sort dropdown (moved here from filter bar -- sorting makes sense for the list, not the map)
  - "Create Alert" button (small, secondary)
- Add infinite scroll instead of "Load More" button for smoother browsing

### 2.3 Property card optimization in list
- The list currently uses the full `PropertyCard` with `compact` mode -- keep this but ensure the 2-column grid doesn't produce too-small cards on the 45% panel
- Consider switching to a 1-column layout when the panel is narrow (below 400px) using a ResizeObserver

---

## Phase 3: Map Controls and Interaction Refinements

**Goal:** Make the map toolbar cleaner, add missing UX affordances, and polish interactions.

### 3.1 Reorganize the map toolbar
Current toolbar is a 2x2 grid that's hard to scan. Reorganize into clear vertical groups:
- **Navigation group:** Zoom In, Zoom Out, My Location (vertical stack, always visible)
- **Tools group:** Draw tool dropdown, Share (vertical stack)
- **Layers group:** A single "Layers" button that opens a popover/dropdown with toggleable layers:
  - Train Stations
  - Anglo Community Spots
  - Price Heatmap
  - Neighborhood Boundaries
  - Saved Locations
- This replaces 4-5 individual toggle buttons with one organized menu

### 3.2 "Search this area" button
- When the user pans the map with "Search as I move" disabled (or after drawing a polygon), show a prominent "Search this area" button floating at the top-center of the map
- Currently the user has no visual cue that results are stale after panning

### 3.3 Marker clustering at low zoom
- When zoomed in to a city but there are 50+ markers visible, implement marker clustering using the existing `supercluster` dependency (already installed but not used on the map!)
- Show cluster circles with counts that expand on click
- This prevents marker overlap and improves performance

### 3.4 Property popup improvements
- Add left/right arrow navigation in the popup to cycle through nearby properties without closing
- Add a small image carousel (2-3 dots) within the popup if the property has multiple images

### 3.5 Commute filter integration
- The CommmuteFilter component exists and works but is only connected to the dead MapFiltersBar
- Wire it into the live PropertyFilters "More Filters" popover or as a standalone floating control
- This is a key differentiator for BuyWise (Anglo audience cares about commute to work/school)

---

## Phase 4: Performance and Strategic Enhancements

**Goal:** Optimize data fetching and add high-value features.

### 4.1 Optimize city overlay query
- Replace the current approach of fetching ALL properties to count by city with a single grouped query:
  ```sql
  SELECT city, COUNT(*) FROM properties
  WHERE listing_status = $1 AND is_published = true
  GROUP BY city
  ```
- This eliminates transferring thousands of rows just for counts

### 4.2 Marker rendering optimization
- Wrap the property marker list in a virtualized layer that only renders markers within the current viewport bounds (Leaflet handles this natively for tile layers, but React markers need manual culling for 500+ properties)
- The current client-side polygon filter is fine for now but should eventually move server-side

### 4.3 URL state persistence improvements
- Save the active layers (train, heatmap, anglo) in URL params so shared links preserve the exact view
- Save the panel split ratio in localStorage so returning users get their preferred layout

### 4.4 "Recently viewed" indicator on markers
- If the user has visited a property detail page, show a subtle "seen" indicator (small dot or reduced opacity) on that marker
- Use localStorage to track viewed property IDs

### 4.5 Better empty state
- When the map shows no properties in the viewport, display a subtle overlay message on the MAP itself (not just in the list panel) suggesting the user zoom out or adjust filters
- The current empty state only appears in the list panel, which users may not be looking at

---

## Technical Summary

```text
Files to DELETE (Phase 1):
  - src/components/map-search/MapFiltersBar.tsx
  - src/components/map-search/MapFilterDialog.tsx
  - src/components/map-search/MapHoverPopup.tsx
  - src/components/map-search/MapEmptyState.tsx

Files to CREATE:
  - src/components/map-search/MobileMapFilterBar.tsx (compact mobile filter row)
  - src/components/map-search/SearchThisAreaButton.tsx (floating CTA)
  - src/components/map-search/LayersMenu.tsx (consolidated layer toggles)
  - src/components/map-search/MarkerCluster.tsx (supercluster integration)

Files to MODIFY heavily:
  - src/components/map-search/MapSearchLayout.tsx (mobile simplification, filter bar changes)
  - src/components/map-search/MobileMapSheet.tsx (becomes the sole mobile view)
  - src/components/map-search/PropertyMap.tsx (toolbar refactor, clustering, layers menu)
  - src/components/map-search/MapToolbar.tsx (reorganize into groups + layers menu)
  - src/components/map-search/MapPropertyList.tsx (header improvements, infinite scroll)
  - src/components/map-search/CityOverlay.tsx (optimized query)
  - src/components/filters/PropertyFilters.tsx (add mapMode prop)
  - src/index.css (cleanup dead CSS, new styles)
```

Each phase is independently shippable. Phase 1 alone will make the map feel dramatically cleaner by removing dead code and simplifying the mobile experience from 3 rows of chrome to 1.

