

# Neighborhood Click on Map — Best Approach

## The Problem

The neighborhood boundary names come from CBS (Central Bureau of Statistics) — e.g., "German Colony - Old Katamon (Gonen)", "City Center, Mamilla, Musrara, Geula, Me'a She'arim, Nahlaot, Rehavia". The property listings have short scraped names like "German Colony", "Katamon", "Rehavia". These almost never match, so filtering by boundary name returns zero results.

**Making the filter "just work" would require** a fuzzy mapping table between ~310 CBS boundary names and the free-text neighborhood values in listings — an unreliable, ongoing maintenance burden with no guarantee of accuracy.

## Recommended Solution: Zoom to Fit (No Filter)

When a user clicks a neighborhood boundary on the map:
1. **Zoom the map to fit that polygon's bounds** — this naturally shows only the listings physically within that area (since listings outside the viewport are excluded by the existing bounds-based query)
2. **Visually highlight** the selected polygon (already works)
3. **Do NOT apply a text-based neighborhood filter** — let the map bounds do the filtering spatially

This is how Zillow and most map-based property search tools work. The map viewport IS the filter.

## Changes

### 1. NeighborhoodBoundariesLayer.tsx
- Update `onNeighborhoodClick` to pass both the name AND the polygon path coordinates
- Signature: `(name: string, path: Array<{lat: number, lng: number}>)` → `void`

### 2. PropertyMap.tsx
- Update the click handler to call `map.fitBounds()` with coordinates from the clicked polygon
- Remove the `onNeighborhoodFilter` prop entirely
- Toggle: clicking same neighborhood again zooms back out

### 3. NeighborhoodChips.tsx
- Remove `onFilterNeighborhood` prop and its usage
- Keep the existing pan/zoom behavior (already zooms to centroid)
- Optionally also use `fitBounds` for better framing

### 4. MapSearchLayout.tsx
- Remove `handleNeighborhoodFilter` callback
- Remove `onNeighborhoodFilter` prop from both desktop and mobile `PropertyMap` instances
- The `neighborhoods` URL param will no longer be set by map clicks (the filter panel on `/listings` can still use it)

## What This Means for Users
- Click a neighborhood on map → map zooms to show that area → listings in that zone appear naturally because they're within the viewport
- No confusing "0 results" when clicking a neighborhood that clearly has listings
- The neighborhood filter dropdown in the filter bar (used on `/listings` page) continues to work independently

