
## Fix: City Selection Not Zooming to City

### The Problem

When you select a city from the filter dropdown, the map should zoom to that city's location. Currently, it doesn't work because:

1. **React-Leaflet's `MapContainer` limitation** - The `center` and `zoom` props only work on initial render. After the map mounts, changing these props has no effect on the map view.

2. **Missing view synchronization** - There's no component inside the map that listens for changes to the center/zoom state and updates the map accordingly.

### The Solution

Add a `MapViewUpdater` component inside `MapContainer` that:
- Uses `useMap()` to get the map instance
- Watches for changes to `center` and `zoom` props
- Calls `map.flyTo()` to smoothly animate to the new location when they change

---

## Technical Changes

### 1. Create `MapViewUpdater` Component (inside `PropertyMap.tsx`)

Add a new internal component that syncs external state to the map:

```typescript
// Syncs external center/zoom state to the map
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);
  
  useEffect(() => {
    // Check if center or zoom actually changed (comparing values, not references)
    const centerChanged = 
      center[0] !== prevCenterRef.current[0] || 
      center[1] !== prevCenterRef.current[1];
    const zoomChanged = zoom !== prevZoomRef.current;
    
    if (centerChanged || zoomChanged) {
      // Fly to new location with smooth animation
      map.flyTo(center, zoom, { duration: 1 });
      
      // Update refs
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [map, center, zoom]);
  
  return null;
}
```

### 2. Add `MapViewUpdater` Inside `MapContainer`

Place it after `MapBoundsListener`:

```tsx
<MapContainer ref={mapRef} center={center} zoom={zoom} ...>
  <TileLayer ... />
  <MapBoundsListener ... />
  <MapViewUpdater center={center} zoom={zoom} />  {/* NEW */}
  <ZoomTracker ... />
  ...
</MapContainer>
```

---

## How It Works

1. User selects "Jerusalem" from city filter dropdown
2. `PropertyFilters` calls `onFiltersChange({ city: "Jerusalem" })`
3. `MapSearchLayout.handleFiltersChange` detects city changed
4. It looks up Jerusalem's coordinates from `allCities` data
5. It calls `setMapCenter([31.7683, 35.2137])` and `setMapZoom(13)`
6. `PropertyMap` receives new `center` and `zoom` props
7. **NEW:** `MapViewUpdater` detects the change and calls `map.flyTo()`
8. Map smoothly animates to Jerusalem

---

## File Changes

| File | Change |
|------|--------|
| `src/components/map-search/PropertyMap.tsx` | Add `MapViewUpdater` component and use it inside `MapContainer` |

---

## Result

After this fix:
- Selecting a city from the filter dropdown will smoothly zoom the map to that city
- Clicking a city marker on the map will also trigger the same smooth zoom effect
- The animation provides a nice user experience showing the transition
