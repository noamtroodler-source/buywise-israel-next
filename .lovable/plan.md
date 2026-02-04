
## Fix: Smooth City-to-City Map Animation

### The Problem

When you switch cities (e.g., from Jerusalem to Beit Shemesh), the map should smoothly fly from one city to the other. Currently, there's a race condition:

1. You select "Beit Shemesh" from the filter
2. `setMapCenter` is called with Beit Shemesh coordinates
3. `MapViewUpdater` starts `flyTo` animation
4. During the animation, `moveend` events fire
5. `handleBoundsChange` updates `mapCenter` with intermediate positions
6. This can interfere with the animation or cause visual glitches

### The Solution

Add a "flying" flag to prevent the bounds listener from overwriting the target coordinates during programmatic animations:

1. **Add `isFlying` ref** - Track when a programmatic flyTo is in progress
2. **Set flag before flyTo** - Mark as flying before starting animation
3. **Clear on animation end** - Listen for `moveend` after animation completes
4. **Skip bounds update during flight** - Don't update center/zoom state while flying

---

## Technical Changes

### 1. Update `MapViewUpdater` in `PropertyMap.tsx`

Add an `isFlying` ref and use Leaflet's animation events:

```typescript
function MapViewUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);
  const isFlyingRef = useRef(false);
  
  useEffect(() => {
    // Check if center or zoom actually changed
    const centerChanged = 
      center[0] !== prevCenterRef.current[0] || 
      center[1] !== prevCenterRef.current[1];
    const zoomChanged = zoom !== prevZoomRef.current;
    
    if (centerChanged || zoomChanged) {
      // Mark as flying to prevent bounds updates during animation
      isFlyingRef.current = true;
      
      // Fly to new location with smooth animation
      map.flyTo(center, zoom, { duration: 1.5 });
      
      // Clear flying flag when animation ends
      const onMoveEnd = () => {
        isFlyingRef.current = false;
        map.off('moveend', onMoveEnd);
      };
      map.once('moveend', onMoveEnd);
      
      // Update refs
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
    }
  }, [map, center, zoom]);
  
  return null;
}
```

### 2. Pass `isFlying` State to `MapBoundsListener`

Expose the flying state so bounds listener can skip updates:

```typescript
// Add to PropertyMap component state
const isFlyingRef = useRef(false);

// Pass to MapViewUpdater
<MapViewUpdater 
  center={center} 
  zoom={zoom} 
  isFlyingRef={isFlyingRef}
/>

// Pass to MapBoundsListener
<MapBoundsListener 
  onBoundsChange={...}
  searchAsMove={searchAsMove}
  isFlyingRef={isFlyingRef}
/>
```

### 3. Update `MapBoundsListener` to Skip During Flight

```typescript
function MapBoundsListener({ 
  onBoundsChange,
  searchAsMove,
  isFlyingRef,
}: { 
  onBoundsChange: ...;
  searchAsMove: boolean;
  isFlyingRef: React.RefObject<boolean>;
}) {
  // ... existing code ...

  const handleMoveEnd = useCallback(() => {
    // Skip if programmatic flight in progress
    if (isFlyingRef.current) return;
    if (!searchAsMove) return;
    
    // ... rest of existing code ...
  }, [map, onBoundsChange, searchAsMove, isFlyingRef]);
}
```

### 4. Increase Animation Duration

Change from 1 second to 1.5 seconds for a smoother, more noticeable transition when flying between distant cities:

```typescript
map.flyTo(center, zoom, { duration: 1.5 });
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/map-search/PropertyMap.tsx` | Add `isFlyingRef`, update `MapViewUpdater` to set/clear flag, update `MapBoundsListener` to respect flag |

---

## Result

After this fix:
- Selecting a city from the dropdown will smoothly animate the map from current location to the new city
- The animation won't be interrupted by bounds update callbacks
- Works for both city overlay clicks and filter dropdown selections
- The 1.5-second duration provides a nice visual guide showing the journey between cities
