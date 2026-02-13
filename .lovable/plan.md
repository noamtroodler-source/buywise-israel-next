

# Phase 3: Price Markers + Map Interactivity

This phase adds the signature Zillow-style price pill markers to the map, clusters them at low zoom levels, and wires up hover syncing between map markers and list cards.

## What Gets Built

1. **PropertyMarker** -- Floating price-pill markers rendered via Leaflet `DivIcon`, with hover scaling, active state, and visual indicators for hot listings and price drops
2. **MarkerClusterLayer** -- Uses `supercluster` (already installed) to cluster markers at low zoom, showing count badges with smooth transitions
3. **MapPropertyPopup** -- A compact popup card shown when clicking a marker, with image, price, stats, and a "View" link
4. **Hover sync** -- Hovering a list card highlights the corresponding marker on the map (and vice versa), without scrolling the list (stagnant list model)

## Marker Design

```text
Individual marker (price pill):
+-------------------+
|  ₪2.5M            |   <- rounded-full, white bg, shadow, 12px font
+-------------------+

Hot listing (<=3 days):     Price drop:
+-------------------+       +-------------------+
|  ₪2.5M        ●  |       |  ₪2.5M        ▼  |
+-------------------+       +-------------------+
  (green dot)                 (red down arrow)

Hovered state: scale(1.1), z-index 200, ring-2 ring-primary
Active state: bg-primary, text-white

Cluster marker:
  (  42  )   <- circle, bg-primary/80, white text, size scales with count
```

## Popup Design (on marker click)

```text
+-------------------------------+
|  [Image 3:2]     ₪2,500,000  |
|                  3bd 2ba 90m  |
|                  Herzliya     |
+-------------------------------+
```

Compact horizontal card, ~280px wide, auto-pans disabled. Clicking anywhere navigates to the property page.

## Hover Sync Flow

```text
Card hover ──> setHoveredPropertyId(id) ──> PropertyMarker gets .marker-hovered class
                                              (scale up, ring highlight)

Marker hover ──> setHoveredPropertyId(id) ──> MapListCard gets ring-primary border
                                              (NO auto-scroll, stagnant list)
```

## Files

### New: `src/components/map-search/PropertyMarker.tsx`
- Receives `property: Property`, `isHovered: boolean`, `isActive: boolean`, `onClick`, `onHover` callbacks
- Creates a Leaflet `DivIcon` with a formatted price string (compact: "2.5M" / "12K")
- Visual modifiers: green dot for new (<=3 days), red arrow for price drop
- Memoized with custom comparison to prevent marker flickering during re-renders
- Uses CSS class toggling (`.marker-hovered`, `.marker-active`) for state changes instead of re-creating the DivIcon

### New: `src/components/map-search/MarkerClusterLayer.tsx`
- Uses `supercluster` and `use-supercluster` (both already installed) to cluster property points
- Converts `properties[]` into GeoJSON points with `latitude`/`longitude`
- At low zoom: renders cluster circles with count; at high zoom: renders individual `PropertyMarker` components
- Cluster circle size scales with point count (small/medium/large)
- Clicking a cluster zooms into its bounds via `map.flyToBounds()`

### New: `src/components/map-search/MapPropertyPopup.tsx`
- Compact horizontal popup card shown when a marker is clicked
- Props: `property: Property`
- Contains: thumbnail image (3:2), price, beds/baths/size, location
- Wrapped in a `Link` to `/property/:id`
- Rendered as a Leaflet `Popup` with `autoPan={false}` and keyed by property ID for clean remounts

### Modified: `src/components/map-search/PropertyMap.tsx`
- Accept new props: `properties`, `hoveredPropertyId`, `activePropertyId`, `onMarkerHover`, `onMarkerClick`
- Render `MarkerClusterLayer` inside the `MapContainer` with the properties array
- Pass hover/active state down to individual markers
- Expose map zoom level to `MarkerClusterLayer` via `useMapEvents`

### Modified: `src/components/map-search/MapSearchLayout.tsx`
- Add `hoveredPropertyId` state (lifted to orchestrator level)
- Pass `properties` + hover callbacks down to `PropertyMap`
- Pass `hoveredPropertyId` down to `MapListPanel`

### Modified: `src/components/map-search/MapListPanel.tsx`
- Accept `hoveredPropertyId` prop, pass it to each `MapListCard`

### Modified: `src/components/map-search/MapListCard.tsx`
- Accept `isHovered` prop (from map marker hover)
- Accept `onHover` / `onHoverEnd` callbacks to report hover state up
- Apply `ring-2 ring-primary` border when `isHovered` is true (from map hover)

## Technical Details

- **Price formatting**: Compact format for markers -- "2.5M" for millions, "850K" for thousands (ILS), "$320K" for USD. Uses the user's currency preference.
- **Clustering**: `supercluster` with `radius: 60`, `maxZoom: 16`. Properties without coordinates are excluded from marker rendering but still appear in the list.
- **Performance**: `PropertyMarker` uses `React.memo` with a custom comparator checking only `property.id`, `isHovered`, and `isActive`. The `DivIcon` HTML is cached and only regenerated when the price or visual state changes.
- **Z-index**: Hovered markers get z-index 200 (above other markers at default). Active (clicked) markers get z-index 201. Controls stay at z-index 40.
- **Popup**: Uses `autoPan={false}` to prevent the map from shifting when a popup opens near edges. The popup is keyed by `property.id` so React fully unmounts/remounts on property change.
- **No auto-scroll**: Following the Zillow stagnant-list model, hovering a marker highlights the list card visually but does NOT scroll the list panel.

