

# Phase 2: Clustering Optimization, Performance & Grid/Map View Toggle

## Overview

This phase focuses on three key areas:
1. **Optimizing the existing clustering implementation** for better performance with 600+ properties
2. **Adding CSS styling for cluster markers** that's currently missing
3. **Creating a view toggle** (Grid/Map) on the Listings page so users can switch between the traditional grid view and the new map view

---

## Part 1: Cluster Marker Styling

### Problem
The current cluster markers use inline Tailwind classes in JavaScript template literals, but these won't be processed by Tailwind's JIT compiler since they're dynamically generated. This causes unstyled or broken cluster markers.

### Solution
Add dedicated CSS classes in `src/index.css` for cluster markers and property markers that work independently of Tailwind's JIT compilation.

### Changes to `src/index.css`
Add a new section for map-specific styles:

```css
/* Map Marker Styles */
.property-marker {
  white-space: nowrap;
  padding: 6px 10px;
  border-radius: 9999px;
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  transition: all 200ms;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.property-marker.hovered,
.property-marker.selected {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  ring: 2px solid hsl(213 94% 45%);
}

.cluster-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: hsl(213 94% 45%);
  color: white;
  border-radius: 9999px;
  padding: 8px 12px;
  min-width: 60px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  cursor: pointer;
  transition: transform 200ms;
}

.cluster-marker:hover {
  transform: scale(1.05);
}

.cluster-marker .cluster-count {
  font-weight: 700;
  font-size: 14px;
  line-height: 1.2;
}

.cluster-marker .cluster-price {
  font-size: 11px;
  opacity: 0.9;
  line-height: 1.2;
}

/* Leaflet popup overrides */
.leaflet-popup-content-wrapper {
  border-radius: 12px;
  padding: 0;
}

.leaflet-popup-content {
  margin: 12px;
}
```

---

## Part 2: Clustering Performance Optimization

### Current State
The clustering uses `use-supercluster` which is good, but several optimizations are needed:

1. **Bounds update on initial load** - Currently uses `[-180, -85, 180, 85]` as initial bounds
2. **Debounced updates** - Already implemented in `MapBoundsListener` but can be improved
3. **Memoization** - Points array is memoized, good

### Optimizations to PropertyMap.tsx

1. **Better initial bounds calculation** from map center and zoom
2. **Cluster styling using CSS classes** instead of inline styles
3. **Add cluster size tiers** for visual hierarchy (small/medium/large clusters)

### ClusterMarker Improvements
- Add size tiers: 
  - Small (2-10 properties): 50px diameter
  - Medium (11-50 properties): 65px diameter
  - Large (51+ properties): 80px diameter
- Improve hover/click feedback

---

## Part 3: Grid/Map View Toggle on Listings Page

### User Flow
On `/listings` and when viewing rentals:
1. User sees a toggle button group in the filter bar area
2. "Grid" (default) shows the current card-based layout
3. "Map" navigates to `/map` with all current filters preserved in URL

On `/map`:
1. User sees the same toggle but "Map" is selected
2. Clicking "Grid" navigates back to `/listings` with filters preserved

### Implementation

#### New Component: `ViewToggle.tsx`
Location: `src/components/filters/ViewToggle.tsx`

A simple toggle button group:
```
[Grid Icon] Grid | [Map Icon] Map
```

Props:
- `activeView: 'grid' | 'map'`
- `onViewChange: (view: 'grid' | 'map') => void`

#### Changes to PropertyFilters.tsx
Add the `ViewToggle` component in the filter bar, positioned after the sort dropdown on desktop.

#### Changes to Listings.tsx
1. Import and render `ViewToggle` with `activeView="grid"`
2. On "Map" click, navigate to `/map` with current search params

#### Changes to MapSearchLayout.tsx
1. Import and render `ViewToggle` with `activeView="map"` in the `MapFiltersBar`
2. On "Grid" click, navigate to `/listings` with current search params

#### URL Parameter Synchronization
Both pages already use URL params (`?status=for_sale&city=Tel+Aviv&min_price=...`). When switching views:
- Extract all current URL params
- Navigate to the other page with same params
- The target page will parse and apply filters from URL

---

## Part 4: Loading States & Skeleton UI

### Current State
`MapPropertyList.tsx` has loading skeletons, but they could be improved.

### Improvements
1. Add skeleton for cluster markers during initial load
2. Improve loading overlay visibility
3. Add shimmer effect to loading states

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/filters/ViewToggle.tsx` | Toggle between Grid and Map views |

## Files to Modify

| File | Changes |
|------|---------|
| `src/index.css` | Add cluster marker and map popup styles |
| `src/components/map-search/PropertyMap.tsx` | Optimize clustering, use CSS classes, add size tiers |
| `src/components/filters/PropertyFilters.tsx` | Add ViewToggle component |
| `src/pages/Listings.tsx` | Handle view toggle navigation to map |
| `src/components/map-search/MapFiltersBar.tsx` | Add ViewToggle for map-to-grid navigation |
| `src/components/map-search/MapSearchLayout.tsx` | Pass listingType to MapFiltersBar |
| `src/lib/routes.ts` | Add mapUrl helper function |

---

## Technical Details

### ViewToggle Component Design
```tsx
interface ViewToggleProps {
  activeView: 'grid' | 'map';
  className?: string;
}

// Uses ToggleGroup from Radix UI (already installed)
// Grid icon: LayoutGrid from lucide-react
// Map icon: Map from lucide-react
// Navigation handled via useNavigate + preserving search params
```

### Cluster Size Tiers Logic
```tsx
const getClusterSize = (count: number) => {
  if (count <= 10) return { size: 50, fontSize: 12 };
  if (count <= 50) return { size: 65, fontSize: 14 };
  return { size: 80, fontSize: 16 };
};
```

### URL Preservation During View Switch
```tsx
const switchToMapView = () => {
  const currentParams = searchParams.toString();
  navigate(`/map?${currentParams}`);
};

const switchToGridView = () => {
  const currentParams = searchParams.toString();
  navigate(`/listings?${currentParams}`);
};
```

---

## Summary

This phase delivers:
1. Properly styled cluster markers via CSS (not broken inline Tailwind)
2. Visual cluster size tiers for better UX at different zoom levels
3. Seamless Grid/Map view toggle that preserves all filters
4. Performance optimizations for large property counts
5. Improved loading states

The view toggle enables users to effortlessly switch between traditional grid browsing and spatial map exploration while maintaining their search context.

