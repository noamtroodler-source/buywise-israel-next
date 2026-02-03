

# Ultimate Map Search Experience for BuyWise Israel

## Executive Summary

This plan creates a world-class, Zillow-inspired map search experience specifically designed for international buyers exploring Israeli real estate. The feature combines split-view browsing, intelligent clustering, draw-to-search, neighborhood boundaries, and BuyWise-exclusive features like saved locations integration and commute time visualization.

---

## Core Architecture

### New Route and Page Structure
- **Route**: `/map` (new page, accessible from navigation)
- **Mobile Route Behavior**: On mobile, shows vertical split (map top, list bottom) with swipe-to-expand gestures
- **Desktop Layout**: Horizontal split with resizable panels (map left ~55%, listings right ~45%)

### State Management
The map view shares URL state with `/listings` for seamless switching:
```
/map?status=for_sale&city=Tel+Aviv&min_price=2000000&max_price=5000000
```
Users can toggle between List View and Map View while preserving all filters.

---

## Feature Breakdown

### 1. Split-View Layout (Desktop and Mobile)

**Desktop (Horizontal Split)**
- Left panel: Interactive map (50-65% width, resizable)
- Right panel: Scrollable property cards in compact format
- Resizable divider using existing `ResizablePanelGroup` component
- Full-screen map toggle button

**Mobile (Vertical Split)**
- Top: Map view (50% height initially)
- Bottom: Swipeable card carousel or scrollable list
- Pull-up gesture to expand list / pull-down to expand map
- Bottom sheet UX pattern for property list

### 2. Price-Based Map Markers

**Marker Design (BuyWise Style)**
- Clean pill-shaped markers showing formatted price
- For Sale: Primary blue background (`hsl(213, 94%, 45%)`)
- For Rent: Muted gray background with "/mo" suffix
- Sold: Muted with strikethrough styling
- Active/Hovered: Scale up + shadow + border highlight
- Size adapts to zoom level (larger at city view, smaller when zoomed in)

**Marker Interaction**
- Click: Opens mini property card popup with image, price, beds/baths, quick actions
- Hover (desktop): Highlights corresponding card in list panel
- Selected: Distinct styling (ring, elevated z-index)

### 3. Intelligent Clustering

**Implementation**
- Use `react-leaflet-markercluster` or custom Supercluster implementation
- Cluster markers show count + price range (e.g., "12 properties | 2.5M-4.2M")
- Smooth zoom animation when clicking cluster
- Progressive disclosure: clusters break apart at appropriate zoom levels

**Performance**
- Virtualized rendering for 600+ properties
- Only render markers within viewport + buffer zone
- Debounced re-render on map move

### 4. Bounding Box Search (Search-as-You-Move)

**How It Works**
- Map movement automatically updates property results
- Toggle: "Search as I move the map" (on by default)
- Visible bounds become the search filter
- URL updates with map center and zoom for shareable links

**Implementation**
- Listen to map `moveend` event
- Extract bounds: `[sw_lat, sw_lng, ne_lat, ne_lng]`
- Add to PropertyFilters: `bounds?: [number, number, number, number]`
- Update `usePaginatedProperties` to filter by bounds on the server

### 5. Draw to Search

**Draw Modes**
- Rectangle: Quick area selection
- Freehand Polygon: Draw custom shapes (using Leaflet.FreeDraw or Leaflet-Geoman)
- Circle: Radius-based search around a point

**UX Flow**
1. Click "Draw" button in map toolbar
2. Draw shape on map
3. Properties within shape are filtered
4. "Clear Drawing" button to reset
5. Shape persists until cleared

**BuyWise Twist: Neighborhood Quick Select**
- Clicking a city shows clickable neighborhood overlay
- Neighborhoods have subtle boundary highlights
- Click neighborhood name to filter to that area

### 6. City and Neighborhood Boundaries

**City Layer**
- When zoomed out, show city labels centered on cities
- Click city label to zoom to that city's bounds

**Neighborhood Overlay**
- When zoomed into a city, show neighborhood boundaries as subtle polygons
- Neighborhoods are clickable and can be multi-selected
- Selected neighborhoods get highlighted border and fill
- Active neighborhoods appear as filter chips below map

### 7. BuyWise-Exclusive: Saved Locations on Map

**Integration with Existing Feature**
- User's saved locations (home, work, family, etc.) appear on map
- Toggle visibility with "Show My Places" button
- Each saved location shows distance/commute from nearby properties

**Visual Treatment**
- Purple markers (matches existing category color)
- Smaller size than property markers
- Label shows location name on hover

### 8. Live Commute Time Visualization

**How It Works**
- User can click any property to see commute times to saved locations
- Shows walking/transit/driving time bubbles
- Lines drawn between property and saved locations with time labels

**BuyWise Twist**
- "Find properties within X minutes of [saved location]" filter
- Commute-based search: select your workplace, show all properties within 30 min commute

### 9. Smart Filter Integration

**Sticky Filter Bar**
- Compact filter bar above map (desktop) or below header (mobile)
- Quick filters: Price range slider, Rooms, Property type
- "More Filters" opens existing MobileFilterSheet
- Live count updates as filters change

**Filter Synchronization**
- Filters are bidirectional with URL
- Map bounds filter stacks with other filters
- "Reset to show all" clears bounds and filters

### 10. Property Card Highlighting

**Synchronized Selection**
- Hover on map marker = highlight corresponding card in list
- Hover on card in list = highlight corresponding marker on map
- Click on card = pan map to center that property

**Visual Feedback**
- Hovered card: subtle border glow
- Selected card: primary border, slightly elevated

---

## Mobile-Specific Features

### Gesture Support
- Native pinch-to-zoom and pan
- Pull-to-refresh on property list
- Swipe between properties in bottom sheet

### Bottom Sheet Property List
- Collapsed: Shows peek of first property card
- Half-expanded: Shows 3-4 cards in scrollable list
- Full-expanded: Full-screen list with mini-map header

### Map Controls
- Floating action buttons: Current location, Zoom in/out
- Filter chip bar scrollable horizontally
- "List View" / "Map View" toggle in header

---

## BuyWise Israel Unique Features

### 1. Anglo-Friendly Neighborhood Context
- Neighborhood overlays include "Anglo presence" indicator
- Tooltip shows helpful context for international buyers

### 2. Market Context Overlay
- Toggle to show price-per-sqm heatmap by area
- Color gradient indicates market price levels
- Helps understand relative value

### 3. Saved Locations Integration
- Unique to BuyWise: See your saved important places
- Visual commute context built into property browsing
- Answers "how far is this from my parents' apartment?"

### 4. Train Station Layer
- Toggle to show train stations on map
- Properties near stations get small train icon
- Helps commuters understand connectivity

### 5. Clickable City Cards
- When zoomed out, cities show as cards with:
  - Property count
  - Median price
  - YoY change indicator
- Click to zoom into city

---

## Technical Implementation

### New Files to Create

```
src/pages/MapSearch.tsx              # Main map search page
src/components/map-search/
  MapSearchLayout.tsx                # Split view container
  PropertyMap.tsx                    # Main map component
  PropertyMarker.tsx                 # Price-based marker
  MarkerCluster.tsx                  # Cluster component
  MapToolbar.tsx                     # Draw tools, layers, controls
  DrawControl.tsx                    # Freehand/rectangle/circle draw
  NeighborhoodOverlay.tsx            # Neighborhood boundaries
  SavedLocationsLayer.tsx            # User's saved locations
  MapPropertyCard.tsx                # Compact property card for map
  MapPropertyPopup.tsx               # Marker click popup
  MobileMapSheet.tsx                 # Mobile bottom sheet for list
  MapFiltersBar.tsx                  # Compact filter bar for map view
src/hooks/
  useMapBounds.ts                    # Bounds-based filtering hook
  useMapClustering.ts                # Supercluster hook wrapper
  useNeighborhoodBoundaries.ts       # Fetch neighborhood polygons
```

### Files to Modify

```
src/App.tsx                          # Add /map route
src/types/database.ts                # Add bounds filter type
src/hooks/usePaginatedProperties.tsx # Add bounds filtering
src/components/filters/PropertyFilters.tsx # Add map view toggle
src/components/layout/MobileBottomNav.tsx # Update Search to link to map
```

### Database Additions

**New Table: `neighborhood_boundaries`**
```sql
CREATE TABLE neighborhood_boundaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES cities(id),
  name text NOT NULL,
  slug text NOT NULL,
  boundary_geojson jsonb NOT NULL,  -- GeoJSON polygon
  center_lat numeric,
  center_lng numeric,
  created_at timestamptz DEFAULT now()
);
```

**City Coordinates (if not existing)**
Add `center_lat` and `center_lng` to cities table for map centering.

### Dependencies

Already installed:
- `react-leaflet` and `leaflet` - core map rendering
- `react-resizable-panels` - split view

Need to install:
- `react-leaflet-markercluster` - efficient marker clustering
- OR `use-supercluster` + `supercluster` - alternative clustering approach
- `leaflet-freedraw` or `terra-draw` - freehand drawing capability

---

## Implementation Phases

### Phase 1: Core Map View
1. Create MapSearch page with split layout
2. Display properties as price markers
3. Implement bounding box search (search as you move)
4. Add map/list view toggle to existing listings page
5. Sync URL state between views

### Phase 2: Clustering and Performance
1. Implement marker clustering
2. Optimize for 600+ properties
3. Add loading states and skeleton UI
4. Virtualize property list panel

### Phase 3: Draw and Boundaries
1. Add draw tools (rectangle, freehand)
2. Create neighborhood boundary overlays
3. Implement neighborhood click-to-filter
4. Add city zoom behavior

### Phase 4: BuyWise Features
1. Integrate saved locations layer
2. Add commute time visualization
3. Train station layer
4. Market context overlay

### Phase 5: Mobile Optimization
1. Bottom sheet property list
2. Gesture refinements
3. Mobile-specific controls
4. Performance optimization

---

## URL Structure

```
/map                                    # Default: for_sale, all Israel
/map?status=for_sale                    # Sales view
/map?status=for_rent                    # Rentals view
/map?city=Tel+Aviv                      # City filter
/map?center=32.0853,34.7818&zoom=14     # Map position
/map?bounds=32.0,34.7,32.1,34.8         # Bounding box (for sharing)
/map?neighborhoods=neve-tzedek,florentin # Neighborhood filter
```

---

## Analytics Events

```
map_view_opened
map_marker_clicked
map_cluster_expanded
map_draw_started
map_draw_completed
map_neighborhood_selected
map_bounds_search
map_saved_location_toggled
map_commute_checked
map_list_scrolled
map_property_hovered
```

---

## Accessibility Considerations

- Keyboard navigation between markers
- Screen reader announcements for property counts
- High contrast mode for markers
- Focus management between map and list panels

---

## Performance Targets

- Initial map load: under 2 seconds
- Marker re-render on move: under 100ms
- Cluster update: under 50ms
- Smooth 60fps panning and zooming

---

## Summary

This map search feature transforms BuyWise Israel from a list-first to a map-first property discovery platform. By combining industry-best-practices from Zillow and Redfin with BuyWise-unique features like saved locations integration and commute visualization, international buyers can explore Israeli real estate spatially - understanding not just what they're buying, but where they'll be living in relation to the places that matter to them.

The feature respects the existing codebase patterns, integrates with current filter systems, and maintains the mobile-first, Zillow-style UX standards already established in the platform.

