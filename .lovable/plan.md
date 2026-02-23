

# Migrate Main Search Map from Leaflet to Google Maps

## Overview

Replace the Leaflet/CARTO-based main search map with Google Maps, which is already loaded via `GoogleMapsProvider`. This will eliminate slow tile fading, provide faster/more reliable rendering, and unify the map stack across the app.

## Scope of Changes

### What stays the same
- All filter logic, URL persistence, data fetching hooks, list panels, mobile sheets
- The overlay cards (`MapPropertyOverlay`, `MapProjectOverlay`) -- just swap `map.latLngToContainerPoint` for Google's equivalent
- `SearchThisAreaButton`, `KeyboardShortcutsDialog` -- no map dependency
- `useMapKeyboardShortcuts` -- only the ref type changes

### What changes

**Core map component** (`PropertyMap.tsx`) -- full rewrite:
- Replace `MapContainer`/`TileLayer` from react-leaflet with `GoogleMap` from `@react-google-maps/api`
- Replace `useMapEvents` with Google Maps `onIdle`/`onBoundsChanged` events
- Replace `LatLngBounds` (Leaflet) with `google.maps.LatLngBounds`
- Store a `google.maps.Map` ref instead of `LeafletMap`

**Marker layers** (`MarkerClusterLayer.tsx`, `PropertyMarker.tsx`, `ProjectMarker.tsx`):
- Replace Leaflet `Marker` + `L.divIcon` with Google Maps `OverlayView` custom class
- The price-pill HTML stays identical -- just rendered via a Google `OverlayView` instead of `L.divIcon`
- City waypoint labels also become `OverlayView` instances

**Overlay cards** (`MapPropertyOverlay.tsx`, `MapProjectOverlay.tsx`):
- Replace `map.latLngToContainerPoint()` with Google's `fromLatLngToPoint()` / projection API
- Replace `map.on('move')` with Google `idle`/`center_changed` listeners

**Toggle layers** (`TrainStationLayer.tsx`, `SavedPlacesLayer.tsx`, `CityAnchorsLayer.tsx`):
- Replace Leaflet `Marker`/`Tooltip` with Google `Marker` + `InfoWindow` or custom `OverlayView`

**Neighborhood boundaries** (`NeighborhoodBoundariesLayer.tsx`):
- Replace Leaflet `Polygon` with `google.maps.Polygon` via `@react-google-maps/api`

**Draw control** (`DrawControl.tsx`):
- Replace `leaflet-geoman` with Google Maps Drawing Manager
- The drawing library needs to be added to the `GoogleMapsProvider` libraries array: `['places', 'drawing']`

**Toolbar** (`MapToolbar.tsx`):
- Change `LeafletMap` type to `google.maps.Map`
- Use `map.setZoom()` instead of `map.zoomIn()`/`map.zoomOut()`

**Neighborhood chips** (`NeighborhoodChips.tsx`):
- Replace `map.flyTo` with `map.panTo` + smooth animation

**Layout connector** (`MapSearchLayout.tsx`):
- Replace `LatLngBounds` import/type with `google.maps.LatLngBounds`
- Update `toBounds()` helper

**Keyboard shortcuts** (`useMapKeyboardShortcuts.ts`):
- Change `L.Map` ref type to `google.maps.Map`

### Helper: Google Maps OverlayView wrapper

Create a reusable `GoogleOverlayView` React component that wraps `google.maps.OverlayView` to render arbitrary React children at a lat/lng position. This replaces all uses of Leaflet's `divIcon` and handles the price pills, train icons, saved place icons, city anchors, and city waypoint labels.

## Technical Details

### New/Modified Files

| File | Action |
|------|--------|
| `src/components/maps/GoogleMapsProvider.tsx` | Add `'drawing'` to libraries array |
| `src/components/maps/GoogleOverlayView.tsx` | **New** -- reusable OverlayView wrapper |
| `src/components/map-search/PropertyMap.tsx` | Rewrite: Leaflet to Google Maps |
| `src/components/map-search/MarkerClusterLayer.tsx` | Rewrite: use GoogleOverlayView |
| `src/components/map-search/PropertyMarker.tsx` | Rewrite: use GoogleOverlayView |
| `src/components/map-search/ProjectMarker.tsx` | Rewrite: use GoogleOverlayView |
| `src/components/map-search/MapPropertyOverlay.tsx` | Update positioning to use Google projection |
| `src/components/map-search/MapProjectOverlay.tsx` | Update positioning to use Google projection |
| `src/components/map-search/TrainStationLayer.tsx` | Rewrite: Google Marker |
| `src/components/map-search/SavedPlacesLayer.tsx` | Rewrite: Google Marker |
| `src/components/map-search/CityAnchorsLayer.tsx` | Rewrite: Google Marker |
| `src/components/map-search/NeighborhoodBoundariesLayer.tsx` | Rewrite: Google Polygon |
| `src/components/map-search/DrawControl.tsx` | Rewrite: Google Drawing Manager |
| `src/components/map-search/MapToolbar.tsx` | Update types from LeafletMap to google.maps.Map |
| `src/components/map-search/NeighborhoodChips.tsx` | Update map type and flyTo |
| `src/components/map-search/MapSearchLayout.tsx` | Replace Leaflet bounds type |
| `src/hooks/useMapKeyboardShortcuts.ts` | Update ref type |

### Google Maps Styling

Apply a clean, light style matching the current CARTO aesthetic -- hide POI labels, simplify transit labels, use muted colors. The style array from `GoogleMiniMap.tsx` will be extended.

### Bounds Change Flow

```text
Google Maps onIdle event
  --> get map.getBounds()
  --> convert to { north, south, east, west }
  --> pass to onBoundsChange (same as today)
```

### Drawing Flow

```text
Google Drawing Manager (polygon mode)
  --> onPolygonComplete callback
  --> extract path coordinates
  --> convert to Polygon type (same format)
  --> pass to onPolygonChange (same as today)
```

## Implementation Order

1. Add `'drawing'` library to `GoogleMapsProvider`
2. Create `GoogleOverlayView` wrapper component
3. Rewrite `PropertyMap.tsx` (core map)
4. Rewrite marker components (`MarkerClusterLayer`, `PropertyMarker`, `ProjectMarker`)
5. Update overlay cards (`MapPropertyOverlay`, `MapProjectOverlay`)
6. Rewrite layer components (Train, Saved, Anchors, Neighborhoods)
7. Rewrite `DrawControl` with Google Drawing Manager
8. Update `MapToolbar`, `NeighborhoodChips`, `MapSearchLayout`
9. Update `useMapKeyboardShortcuts` type

All changes will be done in a single pass since they are interdependent.

