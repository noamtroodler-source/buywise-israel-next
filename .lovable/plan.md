

# Refined Zoom Strategy for Map Markers

Small tweaks to the existing `MarkerClusterLayer` to implement the cleaner zoom thresholds.

## What Changes

| Zoom | Current | New |
|------|---------|-----|
| < 10 | Dots + clusters visible | **Nothing rendered** -- clean map |
| 10-12 | Dots + clusters | Dots (10px, slightly larger) + cluster counts |
| 13-14 | Price pills + clusters | Price pills + cluster counts (no change) |
| 15+ | Price pills + clusters | Price pills, **no clustering** (every property shown) |

## Technical Changes

### 1. MarkerClusterLayer.tsx
- **Early return** when `zoom < 10`: return `null` so nothing renders at country scale
- **Increase maxZoom** from 16 to 14: this makes supercluster stop clustering at zoom 15+, so every property gets its own pill at street level
- Keep `displayMode` threshold at zoom 13 (dot vs pill) -- already correct

### 2. PropertyMarker.tsx (dot CSS only)
- Increase dot size from 8px to 10px for better visibility at zoom 10-11
- Update `iconSize` and `iconAnchor` accordingly

### 3. index.css
- Update `.property-marker-dot` width/height from 8px to 10px

Three small, targeted edits -- no new files, no architectural changes.

