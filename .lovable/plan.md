

# Phase 5: Map Tools + Layers

This phase adds a unified toolbar, draw-to-search, toggleable map layers (train stations, neighborhood boundaries), city overlay pills at low zoom, a "Search this area" button, and neighborhood chips.

## Overview

Six new components plus modifications to `PropertyMap.tsx` and `MapSearchLayout.tsx`. All CSS for these components (city pills, train markers, neighborhood chips, draw mode, boundary labels) is already prepared in `index.css`. Train station data exists in `src/data/trainStations.ts`. Neighborhood boundary coordinates exist in the `cities.neighborhoods` JSONB column. City centers come from `cities.center_lat`/`center_lng` columns. Property counts use the existing `get_city_property_counts` RPC.

## New Files

### 1. `src/components/map-search/MapToolbar.tsx`
Frosted-glass vertical toolbar positioned on the right edge of the map (replacing the existing `MapControls` inline component). Groups:
- **Navigation**: Zoom In, Zoom Out, My Location
- **Tools**: Draw polygon (toggle), Share map view
- **Layers**: Popover menu with toggle switches

Uses `bg-background/90 backdrop-blur-sm` styling with `z-[40]`. Receives the Leaflet map instance plus callback props for toggling draw mode and layer visibility.

### 2. `src/components/map-search/DrawControl.tsx`
Uses `@geoman-io/leaflet-geoman-free` (already installed) to enable freehand polygon drawing on the map. When a polygon is completed:
- Extracts coordinates via Geoman's `pm:create` event
- Converts to `[lng, lat][]` using existing `latLngsToPolygon()` from `geometry.ts`
- Calls `onPolygonDrawn(polygon)` callback
- Shows a "Clear drawing" chip on the map

When draw mode is toggled off or Escape is pressed, clears the drawn layer. Adds the `draw-mode-active` CSS class to the map container for crosshair cursor.

### 3. `src/components/map-search/LayersMenu.tsx`
Popover triggered from the toolbar's Layers button. Contains toggle switches for:
- **Train Stations** -- renders `TrainStationLayer`
- **Neighborhoods** -- renders `NeighborhoodBoundariesLayer`

Each toggle stores its state in a parent `activeLayers` set. The heatmap toggle will be present but disabled ("Coming soon") as a placeholder.

### 4. `src/components/map-search/TrainStationLayer.tsx`
Renders markers from `TRAIN_STATIONS` data using the pre-styled `.train-station-marker` CSS. Each marker shows a train icon (Lucide `Train`), with a tooltip on hover showing the station name. Only renders stations within the current map bounds for performance.

### 5. `src/components/map-search/CityOverlayLayer.tsx`
Visible when zoom < 12. Fetches city property counts via `get_city_property_counts` RPC. Renders each city as a pill marker at `[center_lat, center_lng]` using the pre-styled `.city-marker-pill` CSS classes (small/medium/large tiers based on count). Clicking a pill flies the map to that city and sets the city filter. Hidden when zoom >= 12 (individual property markers take over).

### 6. `src/components/map-search/SearchThisAreaButton.tsx`
Floating button that appears when the user pans/zooms the map AND `searchAsMove` is disabled. Shows "Search this area" centered above the map. Clicking it triggers a bounds-based re-query. The button tracks whether the bounds have changed since the last query.

### 7. `src/components/map-search/NeighborhoodBoundariesLayer.tsx`
When the neighborhoods layer is active and zoom >= 13, fetches neighborhood boundary data from the `cities.neighborhoods` JSONB for the city currently in view. Renders each neighborhood as a `Polygon` overlay with the pre-styled `.leaflet-pm-shape`-like styling (semi-transparent fill, blue stroke). Shows the neighborhood name as a centered tooltip/label using the pre-styled neighborhood boundary label CSS.

### 8. `src/components/map-search/NeighborhoodChips.tsx`
Horizontal scrollable chip bar at the bottom of the map (using pre-styled `.neighborhood-bar` and `.neighborhood-chip` CSS). Shows neighborhood names for the city in view. Clicking a chip flies the map to that neighborhood's boundary center and highlights it. Only visible when zoom >= 13 and neighborhoods layer is active.

## Modified Files

### `src/components/map-search/PropertyMap.tsx`
- Remove the inline `MapControls` component (replaced by `MapToolbar`)
- Add state for: `isDrawMode`, `activeLayers` (Set of layer IDs), `drawnPolygon`, `searchAsMove`, `lastQueriedBounds`
- Add `onZoomChange` callback from `MapEventHandler` to track current zoom level
- Mount new components conditionally:
  - `MapToolbar` (always)
  - `DrawControl` (when `isDrawMode` is true)
  - `TrainStationLayer` (when `activeLayers` has 'trains')
  - `NeighborhoodBoundariesLayer` (when `activeLayers` has 'neighborhoods' and zoom >= 13)
  - `CityOverlayLayer` (when zoom < 12)
  - `SearchThisAreaButton` (when `searchAsMove` is off and bounds changed)
  - `NeighborhoodChips` (when neighborhoods layer active and zoom >= 13)
- Expose new props: `onPolygonChange`, `searchAsMove`, `onSearchThisArea`
- Pass map ref down to `MapToolbar`

### `src/components/map-search/MapSearchLayout.tsx`
- Add `searchAsMove` state (default: `true`)
- Add `drawnPolygon` state
- When a polygon is drawn, add polygon filtering to `mergedFilters` using `isPointInPolygon` from `geometry.ts` (client-side filter on the returned properties)
- Pass `searchAsMove`, `onSearchThisArea`, `onPolygonChange` to `PropertyMap`
- Handle "Search this area" by manually triggering bounds update

### `src/hooks/useMapFilters.ts`
- Add `polygon` URL param support using `serializePolygon`/`deserializePolygon` from `geometry.ts`

## Technical Details

- **Layer state**: Stored as a `Set<string>` in `PropertyMap`, toggled via `LayersMenu`. No URL persistence for layers in this phase (deferred to Phase 7).
- **City overlay data**: Uses `useQuery` with `get_city_property_counts` RPC, `staleTime: 5min`. Only renders when zoom < 12 to avoid clutter with property markers.
- **Neighborhood boundaries**: The `cities.neighborhoods` JSONB contains `boundary_coords` as `[lat, lng][]` arrays. These are converted to Leaflet `LatLng` for polygon rendering.
- **Draw tool**: Geoman is initialized in `DrawControl` via `map.pm.enableDraw('Polygon')`. On `pm:create`, the layer coordinates are extracted and passed up. Only one polygon at a time; drawing a new one replaces the old.
- **Search this area**: When `searchAsMove` is false, `onBoundsChange` still fires but the query bounds are only updated when the user clicks the button. This requires splitting "visual bounds" from "query bounds" in `MapSearchLayout`.
- **Performance**: `CityOverlayLayer` and `TrainStationLayer` filter to visible bounds before rendering markers. `NeighborhoodBoundariesLayer` only loads data for the city currently centered in the viewport.
- **No new dependencies required** -- `@geoman-io/leaflet-geoman-free` is already installed.

## Component Hierarchy After Phase 5

```text
MapSearchLayout
  +-- PropertyFilters (filter bar)
  +-- PropertyMap
  |     +-- MapContainer
  |     |     +-- TileLayer
  |     |     +-- MapEventHandler
  |     |     +-- MarkerClusterLayer (zoom >= 12)
  |     |     +-- CityOverlayLayer (zoom < 12)
  |     |     +-- TrainStationLayer (when toggled)
  |     |     +-- NeighborhoodBoundariesLayer (when toggled, zoom >= 13)
  |     |     +-- DrawControl (when draw mode active)
  |     |     +-- MapPropertyPopup (when marker selected)
  |     +-- MapToolbar (absolute positioned)
  |     +-- SearchThisAreaButton (absolute positioned)
  |     +-- NeighborhoodChips (absolute positioned, bottom)
  +-- MapListPanel
```

