

# Add Saved Places & City Anchors as Map Layers

## Overview
Two new toggle layers in the existing Map Layers popover menu (visible in the screenshot). When toggled on, they render markers on the map — similar to how Train Stations already work.

## What Gets Added

### 1. "My Places" Layer (user's saved core locations from profile)
- New toggle in LayersMenu: "My Places" with a `Heart` icon
- Only available when the user is logged in (otherwise the toggle is disabled with a "Sign in" badge)
- Renders markers for each saved location using the location's assigned icon (home, briefcase, heart, star, building)
- Shows a tooltip with the location label and address on hover
- Uses the existing `useSavedLocations` hook to fetch data

### 2. "City Landmarks" Layer (3 anchor points per city)
- New toggle in LayersMenu: "City Landmarks" with a `Landmark` icon
- Renders markers for the city anchors matching the current `cityFilter`
- Each marker uses a small colored dot/icon matching its anchor type (orientation, daily life, mobility)
- Shows a tooltip with the anchor name on hover
- Uses the existing `useCityAnchors` hook to fetch data
- Only shows anchors when a city is selected (otherwise disabled with "Select a city" badge)

## Layer Menu Order (updated)
1. Train Stations
2. Neighborhoods
3. My Places (new)
4. City Landmarks (new)
5. Price Heatmap (Soon)

## Files to Create

### `src/components/map-search/SavedPlacesLayer.tsx`
- A react-leaflet layer component (same pattern as `TrainStationLayer`)
- Uses `useSavedLocations` to get locations
- Creates `L.divIcon` markers with the appropriate lucide icon for each location
- Filters to only visible bounds for performance
- Shows tooltip with label + address

### `src/components/map-search/CityAnchorsLayer.tsx`
- A react-leaflet layer component (same pattern as `TrainStationLayer`)
- Accepts `cityFilter` prop
- Uses `useCityAnchors(cityFilter)` to fetch the 3 anchor points
- Creates `L.divIcon` markers with a small icon matching the anchor type
- Shows tooltip with anchor name + description

## Files to Modify

### `src/components/map-search/LayersMenu.tsx`
- Import `Heart` and `Landmark` from lucide-react
- Add two new entries to the `LAYERS` array:
  - `{ id: 'saved', label: 'My Places', icon: Heart }`
  - `{ id: 'landmarks', label: 'City Landmarks', icon: Landmark }`
- Reorder to place them before the heatmap

### `src/components/map-search/PropertyMap.tsx`
- Import `SavedPlacesLayer` and `CityAnchorsLayer`
- Conditionally render `SavedPlacesLayer` when `activeLayers.has('saved')`
- Conditionally render `CityAnchorsLayer` when `activeLayers.has('landmarks')`, passing `cityFilter`

## Visual Style
- Saved Places markers: small circular badges (like train station markers) with the location's icon, using a warm primary/pink tint to distinguish from property markers
- City Anchor markers: small circular badges with relevant icons (landmark, shopping-bag, car), using a subtle teal/blue tint
- Both use the same tooltip pattern as train stations for consistency

