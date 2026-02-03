

# Phase 3: Draw to Search and City/Neighborhood Overlays

## Overview

This phase adds powerful spatial filtering tools to the map search:
1. **Draw-to-Search Tools** - Rectangle and freehand polygon drawing for custom area filtering
2. **City Overlay Layer** - Clickable city markers when zoomed out that zoom into that city
3. **Neighborhood Overlay** - Clickable neighborhood chips when zoomed into a city
4. **Polygon-based Filtering** - Filter properties that fall within drawn shapes

---

## Part 1: Draw-to-Search Implementation

### Approach: Leaflet-Geoman
We'll use `@geoman-io/leaflet-geoman-free` (MIT licensed) for drawing capabilities. It supports:
- Rectangle drawing
- Freehand polygon drawing  
- Circle drawing (radius-based search)
- Edit/delete of drawn shapes

### New Component: DrawControl.tsx

**Location:** `src/components/map-search/DrawControl.tsx`

**Features:**
- Toolbar buttons: Rectangle, Freehand, Circle, Clear
- Integrates with Leaflet via `useMap()` hook
- Fires callback with GeoJSON polygon when shape is completed
- Disables "Search as I move" when a shape is active
- Visual feedback during drawing

### State Flow
1. User clicks "Draw" in toolbar, selects mode (Rectangle/Freehand/Circle)
2. Drawing mode activates on map
3. User draws shape
4. Shape completion fires event with polygon coordinates
5. MapSearchLayout receives polygon and adds to filters
6. Properties are filtered by point-in-polygon check

### Filter Integration
Add new filter type to `PropertyFilters`:
```typescript
polygon?: [number, number][]; // Array of [lng, lat] coordinates
```

Update `usePaginatedProperties` to handle polygon filtering client-side (Supabase doesn't support native polygon filtering without PostGIS extensions).

---

## Part 2: City Overlay Layer

### Purpose
When zoomed out (zoom < 10), show clickable city markers that:
- Display city name
- Show property count in that city
- Click to zoom into the city

### New Component: CityOverlay.tsx

**Location:** `src/components/map-search/CityOverlay.tsx`

**Features:**
- Fetches cities with coordinates from database
- Renders city markers only when zoom < 10
- Each marker shows: city name + property count badge
- Click handler zooms map to city center at zoom 13
- Optional: Show average price per city

### Visual Design
- Clean pill-shaped labels (similar to Google Maps)
- White background with subtle shadow
- City name in dark text
- Property count as small badge

### Data Source
Uses existing `useCities()` hook which already fetches city data including `center_lat` and `center_lng`.

---

## Part 3: Neighborhood Selection

### Purpose
When zoomed into a city (zoom >= 12), show clickable neighborhood chips that filter results.

### Data Structure
Neighborhoods are stored as JSONB in the `cities` table:
```json
[
  { "name": "North Ra'anana", "description": "New developments and villas" },
  { "name": "City Center", "description": "Close to amenities" }
]
```

### New Component: NeighborhoodOverlay.tsx

**Location:** `src/components/map-search/NeighborhoodOverlay.tsx`

**Features:**
- Detects when user is zoomed into a specific city
- Shows horizontal scrollable chip bar of neighborhoods
- Multi-select capability (click multiple neighborhoods)
- Selected neighborhoods filter property list
- Clear selection button

### Implementation
1. When map bounds are within a city's area (check against city center + radius)
2. Show that city's neighborhoods as filter chips
3. Clicking a chip adds `neighborhoods: ['North Ra'anana']` to filters
4. `usePaginatedProperties` already supports `neighborhood` filter

---

## Part 4: MapToolbar Enhancement

### Updates to MapToolbar.tsx

Add new draw tool buttons:
- **Draw button group:**
  - Rectangle icon - draw rectangular area
  - Pencil icon - freehand polygon
  - Circle icon - radius-based area
- **Clear Drawing** - appears when a shape exists
- Visual state for active drawing mode

### Button Layout
```
[Zoom +]
[Zoom -]
------
[Locate Me]
[Saved Places]
------
[Draw Menu ▼]  <- New dropdown with Rectangle, Freehand, Circle options
[Clear Draw]   <- Only shows when drawing exists
------
[Reset View]
```

---

## Part 5: Client-Side Polygon Filtering

### Point-in-Polygon Algorithm
Since Supabase doesn't have native spatial queries, we'll filter client-side:

```typescript
// Check if a point is inside a polygon using ray-casting algorithm
function isPointInPolygon(point: [number, number], polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    if (((yi > point[1]) !== (yj > point[1])) &&
        (point[0] < (xj - xi) * (point[1] - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}
```

### Integration
In `MapSearchLayout`, when a polygon is active:
1. Fetch all properties within map bounds (existing behavior)
2. Apply additional client-side filter using point-in-polygon
3. Only show properties that fall within the drawn shape

---

## CSS Additions to index.css

```css
/* Draw control styles */
.draw-toolbar-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: all 200ms;
}

.draw-toolbar-button:hover {
  background: hsl(210 40% 96%);
}

.draw-toolbar-button.active {
  background: hsl(213 94% 45%);
  color: white;
}

/* City overlay markers */
.city-overlay-marker {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: white;
  border-radius: 9999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 200ms, box-shadow 200ms;
  white-space: nowrap;
}

.city-overlay-marker:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.city-overlay-marker .city-name {
  font-weight: 600;
  font-size: 13px;
  color: hsl(222 47% 11%);
}

.city-overlay-marker .city-count {
  font-size: 11px;
  background: hsl(213 94% 45%);
  color: white;
  padding: 2px 6px;
  border-radius: 9999px;
}

/* Neighborhood chip bar */
.neighborhood-bar {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  display: flex;
  gap: 8px;
  padding: 8px 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: calc(100% - 32px);
  overflow-x: auto;
}

.neighborhood-chip {
  padding: 6px 12px;
  background: hsl(210 40% 96%);
  border-radius: 9999px;
  font-size: 13px;
  white-space: nowrap;
  cursor: pointer;
  transition: all 200ms;
}

.neighborhood-chip:hover {
  background: hsl(210 40% 90%);
}

.neighborhood-chip.selected {
  background: hsl(213 94% 45%);
  color: white;
}

/* Drawn shape styles */
.leaflet-pm-shape {
  fill-opacity: 0.2 !important;
  stroke-width: 2 !important;
}
```

---

## Files Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/map-search/DrawControl.tsx` | Draw toolbar and Leaflet-Geoman integration |
| `src/components/map-search/CityOverlay.tsx` | City markers when zoomed out |
| `src/components/map-search/NeighborhoodChips.tsx` | Neighborhood filter chips when zoomed in |
| `src/lib/utils/geometry.ts` | Point-in-polygon and geometry utilities |

### Files to Modify

| File | Changes |
|------|---------|
| `package.json` | Add `@geoman-io/leaflet-geoman-free` dependency |
| `src/index.css` | Add draw, city overlay, and neighborhood chip styles |
| `src/types/database.ts` | Add `polygon` to PropertyFilters |
| `src/types/content.ts` | Add `center_lat`, `center_lng` to City type |
| `src/components/map-search/PropertyMap.tsx` | Add DrawControl, CityOverlay, NeighborhoodChips |
| `src/components/map-search/MapSearchLayout.tsx` | Handle polygon state and filtering |
| `src/components/map-search/MapToolbar.tsx` | Add draw tool buttons |

---

## UX Flow

### Draw-to-Search Flow
1. User clicks draw button in toolbar
2. Dropdown shows: Rectangle, Freehand, Circle
3. User selects mode and draws on map
4. Shape appears with subtle fill
5. "Search as I move" auto-disables
6. Properties filter to those inside shape
7. "Clear Drawing" button appears
8. User can redraw or clear

### City Zoom Flow
1. User views Israel at zoom 8-9
2. City markers appear (Tel Aviv, Jerusalem, Haifa, etc.)
3. Each shows name + property count
4. User clicks "Tel Aviv"
5. Map smoothly zooms to Tel Aviv at zoom 13
6. City markers fade out, property markers appear

### Neighborhood Filter Flow
1. User is viewing Tel Aviv at zoom 13+
2. Neighborhood chips appear at bottom: "Neve Tzedek", "Florentin", "Sarona", etc.
3. User clicks "Neve Tzedek" - chip highlights
4. Properties filter to that neighborhood
5. User can multi-select neighborhoods
6. "Clear" button resets selection

---

## Technical Considerations

### Performance
- City overlay only renders when zoom < 10
- Neighborhoods only fetch/show when in single city view
- Polygon filtering is optimized with early exit on bounds check
- Drawn shapes stored in state, not re-rendered unnecessarily

### Mobile Support
- Draw tools work with touch (Leaflet-Geoman supports touch)
- Neighborhood chips are horizontally scrollable
- City markers are tap-friendly size

### State Persistence
- Drawn polygon can be serialized to URL for sharing
- Format: `?polygon=lat1,lng1;lat2,lng2;...`

---

## Dependencies

**New Package:**
```
@geoman-io/leaflet-geoman-free: ^2.16.0
```

This is the free/open-source version of Leaflet-Geoman, MIT licensed.

---

## Summary

Phase 3 delivers powerful spatial filtering that matches Zillow's best features while adding BuyWise-specific value:

1. **Draw-to-Search**: Rectangle, freehand, and circle drawing for precise area filtering
2. **City Quick-Jump**: Click city names when zoomed out to navigate quickly
3. **Neighborhood Filtering**: Easy chip-based neighborhood selection when zoomed in
4. **Client-Side Polygon Filtering**: Fast point-in-polygon filtering without database extensions

These features transform the map from a visualization tool into an active search interface, letting users define exactly where they want to live.

