

## Display Neighborhood Boundaries on the Map

### What you have now
- A `NeighborhoodBoundariesLayer` component that reads `boundary_coords` from the `cities` table — but most neighborhoods lack this data
- A 6MB GeoJSON file with **310 real CBS polygon boundaries** across 25 cities
- The layer is already wired into `PropertyMap` (toggled via the Layers menu at zoom ≥ 13)

### Plan

**Step 1: Create `neighborhood_boundaries` table**
- Columns: `id`, `city`, `neighborhood`, `neighborhood_id`, `geojson_coords` (JSONB — the coordinates array from the GeoJSON)
- Unique constraint on `(city, neighborhood)`
- Public SELECT RLS policy (boundaries are non-sensitive display data)

**Step 2: Import the GeoJSON data**
- Parse the uploaded GeoJSON file, extract each feature's `city`, `neighborhood`, `neighborhood_id`, and `geometry.coordinates`
- Insert all 310 rows into the new table via script

**Step 3: Rewrite `NeighborhoodBoundariesLayer`**
- Query `neighborhood_boundaries` filtered by city instead of reading `boundary_coords` from the `cities` table
- Use the real GeoJSON polygon coordinates (which are `[lng, lat]` format per GeoJSON spec) to render `google.maps.Polygon` objects
- Add neighborhood name labels at polygon centroids (visible at zoom ≥ 14)
- Add click handler: clicking a polygon filters listings to that neighborhood
- Styling: semi-transparent fill with BuyWise blue, highlighted state for selected/hovered neighborhoods

**Step 4: Auto-show boundaries when zoomed into a city**
- Currently boundaries require toggling the "Neighborhoods" layer manually
- Change behavior: auto-detect the primary city visible on the map and load its boundaries when zoom ≥ 13, without requiring the layer toggle
- Keep the layer toggle as an override to hide them if the user prefers a clean map

### What this gives you
- Real, gapless neighborhood boundaries visible on the map when zoomed into any of the 25 cities
- Clickable polygons that filter property results to that neighborhood
- Neighborhood name labels so users can orient themselves
- Data stored permanently in the database for reuse across features

### Technical details
- GeoJSON coordinates are `[longitude, latitude]` — will be converted to Google Maps `{lat, lng}` format during rendering
- Per-city queries keep payloads small (~50-200KB per city vs 6MB for all)
- The `geojson_coords` column stores the raw coordinate arrays as JSONB, avoiding PostGIS dependency

