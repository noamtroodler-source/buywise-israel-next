

## Phase 3: Map Controls and Interaction Refinements

This phase reorganizes the toolbar, adds key UX affordances, and wires up unused features.

---

### 3.1 Reorganize MapToolbar into clear vertical groups

**File: `src/components/map-search/MapToolbar.tsx`**

Replace the current 2x2 grid layout with a vertical stack of logical groups:

**Navigation group** (top, always visible):
- Zoom In
- Zoom Out
- My Location

Stacked vertically in a single `map-toolbar-group` box.

**Tools group** (middle):
- Draw tool (with existing dropdown for Rectangle/Polygon/Circle)
- Share button

Stacked vertically.

**Layers group** (bottom) -- NEW `LayersMenu` popover:
- Single "Layers" button (Layers icon) that opens a popover to the left
- Inside the popover, a checklist of toggleable layers:
  - Train Stations (with Train icon)
  - Anglo Community (with Users icon)
  - Price Heatmap (with Thermometer icon)
  - Saved Locations (with MapPin icon, only shown if user has saved locations)
- Each row is a toggle switch with label and icon
- Active layer count shown as a small badge on the Layers button

**Keyboard shortcuts** button stays at the bottom (desktop only).

Remove the Reset View button from the toolbar (it's available via keyboard "R" and is rarely used).

### 3.2 Create LayersMenu component

**New file: `src/components/map-search/LayersMenu.tsx`**

A Popover-based component that accepts:
- `showTrainStations`, `onToggleTrainStations`
- `showAngloCommunity`, `onToggleAngloCommunity`
- `showPriceHeatmap`, `onTogglePriceHeatmap`
- `showSavedLocations`, `onToggleSavedLocations`, `hasSavedLocations`

Renders a compact popover with Switch toggles for each layer. Only shows "Saved Locations" row when `hasSavedLocations` is true. Shows a count badge on the trigger button when any layers are active.

### 3.3 "Search this area" floating button

**New file: `src/components/map-search/SearchThisAreaButton.tsx`**

A floating button centered at the top of the map (below filter bar) that appears when:
- `searchAsMove` is false AND no polygon is drawn, OR
- The user has panned the map after disabling searchAsMove

Props:
- `visible: boolean`
- `onClick: () => void`

Styled as a prominent pill button: white bg, shadow, blue text, "Search this area" label with a RefreshCw icon.

**File: `src/components/map-search/PropertyMap.tsx`**

- Add state `showSearchButton` that tracks when the user pans with searchAsMove off
- When user pans (moveend fires with searchAsMove=false), set `showSearchButton = true`
- When button is clicked: re-enable searchAsMove, trigger bounds update, hide button
- Render `SearchThisAreaButton` in the map overlay div

### 3.4 Marker clustering with supercluster

**New file: `src/components/map-search/MarkerClusterLayer.tsx`**

Uses the already-installed `use-supercluster` hook:
- Accepts `properties`, `mapBounds`, `zoom`, `hoveredPropertyId`, `selectedPropertyId`, `onHover`, `onClick`
- Converts properties to GeoJSON points
- Uses `useSupercluster` to get clusters
- Renders:
  - **Cluster markers**: Circle with count, styled similarly to city markers but smaller. Click zooms into cluster bounds.
  - **Individual markers**: Delegates to existing `PropertyMarker` component

**File: `src/components/map-search/PropertyMap.tsx`**

- Replace the direct `.map(property => <PropertyMarker>)` block with `<MarkerClusterLayer>`
- Pass current `mapBounds` and `currentZoom` to the cluster layer
- Only cluster when there are 50+ visible markers (below that, show individual markers directly)

### 3.5 Property popup navigation arrows

**File: `src/components/map-search/MapPropertyPopup.tsx`**

- Accept new prop: `onNavigate: (direction: 'prev' | 'next') => void`
- Add left/right arrow buttons flanking the popup image header
- Semi-transparent circular buttons positioned at left and right edges of the image
- Clicking navigates to the prev/next property in the visible list

**File: `src/components/map-search/PropertyMap.tsx`**

- Compute `visiblePropertyIds` from the current properties array
- Pass `onNavigate` callback to `MapPropertyPopup` that finds the current index in `visiblePropertyIds` and calls `onPropertySelect` with the prev/next id (wrapping around)

### 3.6 Wire CommuteFilter into the map

**File: `src/components/map-search/PropertyMap.tsx`**

- Accept new props: `commuteFilter`, `savedLocations`, `onCommuteFilterChange`
- Render `CommuteFilter` as a floating control at the bottom-left of the map (only when user has saved locations)
- The filter is already fully functional -- it just needs to be placed somewhere accessible

**File: `src/components/map-search/MapSearchLayout.tsx`**

- Pass `commuteFilter`, `savedLocations`, and `onCommuteFilterChange` through to `PropertyMap`

---

### Summary of changes

| File | What changes |
|------|-------------|
| `MapToolbar.tsx` | Reorganize from 2x2 grid to vertical groups; remove individual layer toggles; add Layers button |
| `LayersMenu.tsx` | NEW -- Popover with Switch toggles for all map layers |
| `SearchThisAreaButton.tsx` | NEW -- Floating "Search this area" pill button |
| `MarkerClusterLayer.tsx` | NEW -- Supercluster integration wrapping PropertyMarker |
| `PropertyMap.tsx` | Integrate SearchThisAreaButton, MarkerClusterLayer, CommuteFilter; pass navigation to popup |
| `MapPropertyPopup.tsx` | Add prev/next arrow navigation |
| `MapSearchLayout.tsx` | Pass commute filter props to PropertyMap |

