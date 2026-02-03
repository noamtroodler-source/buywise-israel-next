
# Phase 4: BuyWise Exclusive Features

## Overview

This phase adds the unique BuyWise features that differentiate the map search from competitors:
1. **Enhanced Saved Locations Layer** - Interactive commute lines from property to saved locations
2. **Commute Time Visualization** - Lines and time bubbles on property click
3. **Train Station Layer** - Toggle to show train stations on map
4. **Market Context Overlay** - Price-per-sqm heatmap toggle

---

## Part 1: Enhanced Saved Locations with Commute Lines

### Current State
- `SavedLocationsLayer.tsx` shows purple markers for saved locations
- `SavedLocationsSection.tsx` calculates distances using Haversine formula
- Travel time formulas already exist: walk (12 min/km), transit (1.8 min/km + 10), drive (1.2 min/km + 2)

### Enhancement: CommuteLines Component
When a property is selected, draw lines from the property to each saved location with travel time labels.

**New Component:** `src/components/map-search/CommuteLines.tsx`

Features:
- Render `Polyline` from selected property to each saved location
- Travel time badge at midpoint of each line
- Color-coded by mode (walk: green, transit: blue, drive: gray)
- Lines appear only when a property is selected
- Fade animation on appear/disappear

### Visual Design
```
Property ---- 15 min (car) ---- Saved Location (Work)
   |
   ---- 25 min (transit) ---- Saved Location (Parents)
```

- Dashed lines with gradient
- Midpoint bubble showing travel time
- Purple destination markers (existing)
- Subtle animation on line appearance

---

## Part 2: Train Station Layer

### Data Source
Cities table already has `has_train_station` boolean and `center_lat`/`center_lng` coordinates.

We'll use Israel Railways station data. Create a static data file with known train stations:

**New File:** `src/data/trainStations.ts`

```typescript
export interface TrainStation {
  id: string;
  name: string;
  nameHe: string;
  latitude: number;
  longitude: number;
  lines: string[]; // e.g., ['Tel Aviv - Beer Sheva', 'Coastal Line']
}

export const TRAIN_STATIONS: TrainStation[] = [
  // Major stations with coordinates
  { id: 'tlv-hashalom', name: 'Tel Aviv HaShalom', ... },
  { id: 'herzliya', name: 'Herzliya', ... },
  // etc.
];
```

### New Component: TrainStationLayer.tsx

**Location:** `src/components/map-search/TrainStationLayer.tsx`

Features:
- Toggle visibility from MapToolbar
- Train icon markers at each station
- Click to show station name and lines
- Only show when zoom >= 11 (city level)
- Marker style: white background with train icon

### MapToolbar Update
Add train station toggle button next to saved locations toggle.

---

## Part 3: Market Context Overlay (Price Heatmap)

### Data Source
Cities have `average_price_sqm` data. We'll create a choropleth-style overlay.

### Implementation Approach
Since we don't have precise city boundary polygons, use a circle-based heatmap:
- Center circles on city coordinates
- Color by price-per-sqm (green = affordable, yellow = moderate, red = expensive)
- Opacity overlay, subtle enough not to obstruct map

**New Component:** `src/components/map-search/PriceHeatmapLayer.tsx`

Features:
- Circular overlays on each city with coordinates
- Color scale: 
  - Green: < ₪30,000/sqm
  - Yellow: ₪30,000-50,000/sqm
  - Orange: ₪50,000-70,000/sqm
  - Red: > ₪70,000/sqm
- Very low opacity (0.15-0.2) to not obstruct view
- Legend in corner showing price ranges
- Toggle on/off from toolbar

### MapToolbar Update
Add heatmap toggle button with gradient icon.

---

## Part 4: Enhanced Property Popup with Commute Info

### Enhancement to MapPropertyPopup.tsx
When a property is selected and user has saved locations:
- Show mini commute section in popup
- Display closest saved location with travel time
- "See all commutes" expands to full list

---

## Part 5: Quick Commute Filter

### New Feature: "Within X minutes of [Location]"
Add a filter option to find properties within a certain commute time of a saved location.

**Implementation:**
- New filter in MapFiltersBar: "Near my places" dropdown
- Select saved location + max time (15/30/45/60 min)
- Filter properties by calculated distance
- Uses existing travel time formula

---

## File Summary

### New Files to Create

| File | Purpose |
|------|---------|
| `src/components/map-search/CommuteLines.tsx` | Lines from property to saved locations |
| `src/components/map-search/TrainStationLayer.tsx` | Train station markers |
| `src/components/map-search/PriceHeatmapLayer.tsx` | Price-per-sqm heatmap overlay |
| `src/components/map-search/HeatmapLegend.tsx` | Legend for price heatmap |
| `src/data/trainStations.ts` | Static train station data |
| `src/components/map-search/CommuteFilter.tsx` | "Near my places" filter popover |

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/map-search/PropertyMap.tsx` | Add new layers, pass selected property to CommuteLines |
| `src/components/map-search/MapToolbar.tsx` | Add train station and heatmap toggles |
| `src/components/map-search/MapPropertyPopup.tsx` | Add commute info section |
| `src/components/map-search/MapFiltersBar.tsx` | Add commute filter button |
| `src/components/map-search/MapSearchLayout.tsx` | Handle commute filter state |
| `src/index.css` | Add styles for commute lines, train markers, heatmap legend |
| `src/lib/utils/geometry.ts` | Add getDistanceInKm helper |

---

## CSS Additions

```css
/* Commute Lines */
.commute-line-tooltip {
  background: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
}

.commute-line-tooltip.walk {
  color: hsl(142 76% 36%);
}

.commute-line-tooltip.transit {
  color: hsl(213 94% 45%);
}

.commute-line-tooltip.drive {
  color: hsl(215 16% 47%);
}

/* Train Station Markers */
.train-station-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 6px;
  border: 2px solid hsl(213 94% 45%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 200ms;
}

.train-station-marker:hover {
  transform: scale(1.1);
}

.train-station-marker svg {
  color: hsl(213 94% 45%);
}

/* Heatmap Legend */
.heatmap-legend {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 1000;
  background: white;
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 12px;
}

.heatmap-legend-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.heatmap-legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.heatmap-legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}
```

---

## Train Station Data

Israeli Railway has approximately 70 stations. Here are key stations to include:

**Major Stations:**
- Tel Aviv: HaShalom, Merkaz/Savidor, University
- Jerusalem: Yitzhak Navon, Malha
- Haifa: Merkaz, Bat Galim
- Beer Sheva: Merkaz, North/University
- Ben Gurion Airport

**Central Stations:**
- Herzliya, Netanya, Hadera, Binyamina
- Petah Tikva, Bnei Brak, Ramat Gan
- Holon, Bat Yam, Ashdod, Ashkelon
- Modi'in Merkaz, Lod, Rehovot
- Kfar Saba, Ra'anana, Hod HaSharon

---

## UX Flows

### Commute Visualization Flow
1. User has saved locations (work, parents, etc.)
2. User clicks a property on map
3. Dashed lines animate from property to each saved location
4. Midpoint badges show travel time with mode icon
5. Popup shows summary: "15 min drive to Work"

### Train Station Flow
1. User clicks train icon in toolbar
2. Train station markers appear on map
3. Click station to see name and rail lines
4. Useful for commute-conscious buyers

### Price Heatmap Flow
1. User clicks heatmap icon in toolbar
2. Colored circles appear over cities
3. Legend explains color scale
4. Helps understand market prices spatially

### Commute Filter Flow
1. User clicks "Near my places" in filter bar
2. Selects saved location from dropdown
3. Selects max commute time (15/30/45/60 min)
4. Properties filter to those within range
5. Clear filter to show all

---

## Technical Details

### Travel Time Calculation (Existing Logic)
```typescript
// Already in SavedLocationsSection.tsx
const times = {
  walk: distanceKm * 12,           // ~5 km/h walking speed
  transit: distanceKm * 1.8 + 10,  // ~33 km/h avg + 10 min wait
  drive: distanceKm * 1.2 + 2,     // ~50 km/h avg + 2 min parking
};
```

### Distance Calculation (Existing in geometry.ts)
```typescript
// getDistanceInMeters already exists
// Add getDistanceInKm wrapper
export function getDistanceInKm(point1, point2): number {
  return getDistanceInMeters(point1, point2) / 1000;
}
```

### Price Heatmap Color Scale
```typescript
function getPriceColor(pricePerSqm: number): string {
  if (pricePerSqm < 30000) return 'hsl(142 76% 50%)';   // Green
  if (pricePerSqm < 50000) return 'hsl(45 100% 51%)';   // Yellow
  if (pricePerSqm < 70000) return 'hsl(25 95% 53%)';    // Orange
  return 'hsl(0 84% 60%)';                              // Red
}
```

---

## State Management

### New State in PropertyMap.tsx
```typescript
const [showTrainStations, setShowTrainStations] = useState(false);
const [showPriceHeatmap, setShowPriceHeatmap] = useState(false);
```

### New State in MapSearchLayout.tsx
```typescript
const [commuteFilter, setCommuteFilter] = useState<{
  locationId: string;
  maxMinutes: number;
} | null>(null);
```

---

## Summary

Phase 4 delivers the BuyWise-exclusive features that make this map search unique:

1. **Commute Lines**: Visual connection between properties and saved locations
2. **Train Stations**: Interactive layer showing Israel's rail network
3. **Price Heatmap**: Spatial market context for price comparisons
4. **Commute Filter**: Find properties within X minutes of your important places

These features directly address the needs of international buyers who want to understand:
- How far is this from my workplace?
- Is there public transit nearby?
- How does this area compare price-wise?
- Show me everything within 30 minutes of my parents

The implementation reuses existing distance/travel time logic and adds visual map layers to make this information instantly accessible while browsing.
