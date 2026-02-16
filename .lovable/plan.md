
# Zillow-Style Map Markers: Remove Clustering, Always Show Price Pills

## Summary
Replace the current clustering approach with a Zillow-style system where every property shows its price pill at all zoom levels (10+). No more numbered cluster circles -- users see actual prices immediately.

## What Changes

### Zoom Behavior (Before vs After)

```text
Zoom Level   | BEFORE                    | AFTER
-------------|---------------------------|---------------------------
<= 9         | City waypoint labels      | City waypoint labels (same)
10-12        | Dots + cluster circles    | Price pills (no clusters)
13-14        | Pills + cluster circles   | Price pills (no clusters)
15+          | Pills only                | Price pills (same)
```

### Key Decisions
- **No clustering at any zoom** -- supercluster is still used but with `maxZoom: 0` effectively disabled, or we skip it entirely and render markers directly
- **Always price pills** -- the `displayMode` concept of "dot" vs "pill" is removed; it's always "pill"
- **City waypoints at zoom <= 9** stay exactly as they are
- **Performance**: Since properties are already viewport-filtered by the query, the number of markers on screen is bounded by the data fetch limit. This is manageable for Israel's market density.

## Files to Modify

### 1. `src/components/map-search/MarkerClusterLayer.tsx` (major rewrite)
- Remove `useSupercluster` entirely -- no more clustering
- Remove `getClusterIcon` function and cluster click handler
- Remove `displayMode` variable (always 'pill')
- Keep city waypoints at zoom <= 9
- For zoom > 9: directly iterate over `properties` and `projects` arrays, rendering `PropertyMarker` and `ProjectMarker` for each, without going through supercluster
- Remove the `clusterRadius` variable
- Keep bounds/zoom state for city waypoint threshold only

### 2. `src/components/map-search/PropertyMarker.tsx`
- Remove `displayMode` prop entirely
- Remove all "dot" rendering code (`createDotHtml`, dot-related icon branch, dot CSS class toggling)
- Always render the price pill
- Simplify the `memo` comparison (remove `displayMode`)
- Keep hover/active/indicator logic unchanged

### 3. `src/components/map-search/ProjectMarker.tsx`
- Same changes as PropertyMarker: remove `displayMode` prop, remove dot code path
- Always render the project pill with building icon
- Simplify memo comparison

### 4. `src/index.css`
- Remove `.property-marker-dot` styles (the dot circle styles)
- Remove `.marker-cluster-container` and `.marker-cluster-circle` styles
- Keep all `.property-marker-pill` styles unchanged

### 5. `src/components/map-search/PropertyMap.tsx`
- No changes needed -- it just passes data to `MarkerClusterLayer` which handles the rendering

## Technical Details

### MarkerClusterLayer simplified structure:
```text
if zoom <= 9:
  render city waypoints (unchanged)
else:
  for each property -> <PropertyMarker />
  for each project -> <ProjectMarker />
```

### Performance consideration
The properties array is already filtered to the current viewport by the parent query (bounded by DB query limits). Rendering individual markers without clustering is standard practice for datasets under ~500 markers, which matches Israel's typical viewport density.

### What gets removed
- `useSupercluster` hook usage (the dependency stays installed, just unused here)
- Cluster circle markers and their click-to-zoom behavior
- Dot display mode at zoom 10-12
- All cluster-related CSS
