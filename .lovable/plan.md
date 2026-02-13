

# Dot-to-Price-Pill Map Marker System

Replace the city overlay layer with a clean Redfin/Zillow-style zoom-based marker system: dots at low zoom, price pills at neighborhood zoom.

## Overview

Remove the `CityOverlayLayer` entirely and update `MarkerClusterLayer` + `PropertyMarker` to render differently based on zoom level:

| Zoom | What's shown |
|------|-------------|
| < 9 | Nothing (too zoomed out, no properties loaded) |
| 9-12 | Small blue dots (8px circles) for individual properties; blue cluster circles with counts for dense areas |
| 13+ | Full price pill markers; cluster circles with counts for dense areas |

## Changes

### 1. Remove CityOverlayLayer from PropertyMap.tsx
- Remove the import of `CityOverlayLayer`
- Remove the `{zoom < 12 && <CityOverlayLayer ... />}` block
- Remove the `onCityClick` prop (no longer needed)
- Remove conditional `properties.length > 0` guard so `MarkerClusterLayer` renders at all zoom levels
- Keep the `zoom` state since it's used elsewhere

### 2. Update MarkerClusterLayer.tsx -- pass zoom to PropertyMarker
- Add a `displayMode` concept based on zoom: `'dot'` (zoom < 13) or `'pill'` (zoom >= 13)
- Pass `displayMode` to each `PropertyMarker`
- Adjust supercluster options: use a larger `radius` (80) at low zoom for tighter clustering, smaller (60) at high zoom
- At dot mode, individual unclustered properties render as simple 8px blue dots instead of price pills

### 3. Update PropertyMarker.tsx -- support dot mode
- Accept new prop `displayMode: 'dot' | 'pill'`
- When `displayMode === 'dot'`:
  - Render a simple 8px blue circle div instead of the price pill
  - Still support hover (grow to 10px) and click interactions
  - No price label, no indicator badges
- When `displayMode === 'pill'`: existing behavior (unchanged)
- Update the memoization comparison to include `displayMode`

### 4. Add dot marker CSS to index.css
- New `.property-marker-dot` class: 8px circle, primary blue background, subtle shadow, centered
- Hover state: scale up slightly, add a ring
- Active state: darker blue, larger ring
- Transition for smooth hover effect

### 5. Clean up city overlay CSS in index.css
- Remove all `.city-marker-pill` styles (lines ~513-577) since the component is removed

### 6. Remove CityOverlayLayer.tsx file
- Delete the file entirely since it's no longer used

## Files Summary

| File | Action |
|------|--------|
| `src/components/map-search/CityOverlayLayer.tsx` | Delete |
| `src/components/map-search/PropertyMap.tsx` | Modify -- remove CityOverlayLayer, always show MarkerClusterLayer |
| `src/components/map-search/MarkerClusterLayer.tsx` | Modify -- zoom-based display mode, pass to PropertyMarker |
| `src/components/map-search/PropertyMarker.tsx` | Modify -- support dot rendering mode |
| `src/index.css` | Modify -- add dot styles, remove city overlay styles |

## Technical Notes

- The `onCityClick` prop on `PropertyMap` can be kept in the interface but becomes a no-op (or removed if nothing upstream depends on it). `MapSearchLayout` passes it, so we'll remove it from both.
- Supercluster's `maxZoom: 16` stays the same -- this controls when clustering stops entirely.
- The dot markers are intentionally simple divs (no Leaflet icon recreation on zoom change) -- the `displayMode` prop change triggers a clean icon swap via React's reconciliation.
- At zoom 9-12, properties are still fetched (bounds-based query), so dots appear immediately. The experience is: zoom in from country view, see dots appear around zoom 9, zoom closer and they merge into clusters or resolve into price pills at zoom 13.
