

## Fix: City-to-City Smooth Animation Not Working

### The Problem

When switching from one city (e.g., Beit Shemesh) to another city (e.g., Jerusalem), the map doesn't smoothly animate between them. The map just stays where it is.

**Root Cause:** There's a synchronization issue between two state sources:

1. **`mapCenter`/`mapZoom` state** - Updated by both:
   - User interactions (panning/zooming) via `handleBoundsChange`
   - Programmatic city selection in `handleFiltersChange`

2. **`prevCenterRef`/`prevZoomRef` in `MapViewUpdater`** - Only updated when `flyTo` is called

When you:
1. Select "Beit Shemesh" → Map flies there → `prevCenterRef` = Beit Shemesh coords
2. Pan the map slightly → `mapCenter` updates to new position
3. Select "Jerusalem" → `handleFiltersChange` sets `mapCenter` to Jerusalem
4. `MapViewUpdater` compares Jerusalem coords vs `prevCenterRef` (Beit Shemesh) → Should detect change ✓

The problem is that `handleBoundsChange` is being called during/after the city selection and overwriting the target coordinates with the current map position before `MapViewUpdater` can process them.

### The Solution

Prevent `handleBoundsChange` from overwriting programmatic center/zoom updates by introducing a "programmatic update in progress" flag:

1. **Add a flag** in `MapSearchLayout` to indicate a programmatic view change is pending
2. **Set the flag** before updating `mapCenter`/`mapZoom` for city selection
3. **Skip state updates** in `handleBoundsChange` while the flag is active
4. **Clear the flag** after `MapViewUpdater` processes the change

---

## Technical Changes

### 1. Add `isProgrammaticMoveRef` in `MapSearchLayout.tsx`

Track when a programmatic map move is initiated:

```typescript
const isProgrammaticMoveRef = useRef(false);
```

### 2. Set Flag in City Selection Logic

Before updating map state for city changes:

```typescript
const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
  const updatedFilters = { ...newFilters, listing_status: listingStatus };
  
  // Check if city was CLEARED
  const cityCleared = filters.city && !newFilters.city;
  if (cityCleared) {
    isProgrammaticMoveRef.current = true;  // Set flag
    const nextCenter = ISRAEL_CENTER;
    const nextZoom = ISRAEL_ZOOM;
    setMapCenter(nextCenter);
    setMapZoom(nextZoom);
    // ... rest of logic
  }
  
  // If city changed to a NEW city
  const cityChanged = newFilters.city && newFilters.city !== filters.city;
  if (cityChanged) {
    const city = allCities?.find(c => c.name === newFilters.city);
    if (city?.center_lat && city?.center_lng) {
      isProgrammaticMoveRef.current = true;  // Set flag
      const nextCenter: [number, number] = [city.center_lat, city.center_lng];
      // ... rest of logic
    }
  }
  // ...
}, [...]);
```

### 3. Skip State Updates in `handleBoundsChange` During Programmatic Move

```typescript
const handleBoundsChange = useCallback((bounds: MapBounds, center: [number, number], zoom: number) => {
  // Skip if programmatic move is in progress
  if (isProgrammaticMoveRef.current) return;
  
  setMapBounds(bounds);
  setMapCenter(center);
  setMapZoom(zoom);
}, []);
```

### 4. Clear Flag After Animation in `PropertyMap.tsx`

Pass the flag to `MapViewUpdater` and clear it after `flyTo` completes:

```typescript
// In PropertyMap props
isProgrammaticMoveRef: React.MutableRefObject<boolean>;

// In MapViewUpdater
function MapViewUpdater({ center, zoom, isFlyingRef, isProgrammaticMoveRef }) {
  // ...
  if (centerChanged || zoomChanged) {
    isFlyingRef.current = true;
    map.flyTo(center, zoom, { duration: 1.5 });
    
    map.once('moveend', () => {
      isFlyingRef.current = false;
      isProgrammaticMoveRef.current = false;  // Clear after animation
    });
    // ...
  }
}
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/map-search/MapSearchLayout.tsx` | Add `isProgrammaticMoveRef`, set it before city changes, skip in `handleBoundsChange` |
| `src/components/map-search/PropertyMap.tsx` | Accept `isProgrammaticMoveRef` prop, clear it in `MapViewUpdater` after animation |

---

## Flow After Fix

1. User selects "Jerusalem" from dropdown while on "Beit Shemesh"
2. `handleFiltersChange` sets `isProgrammaticMoveRef.current = true`
3. `setMapCenter(Jerusalem coords)` is called
4. `handleBoundsChange` is called but skips update because `isProgrammaticMoveRef` is true
5. `MapViewUpdater` detects center change, calls `flyTo(Jerusalem, 13, {duration: 1.5})`
6. Map smoothly animates from Beit Shemesh to Jerusalem
7. Animation completes → `isProgrammaticMoveRef.current = false`
8. Normal bounds tracking resumes

---

## Result

After this fix:
- Switching from one city to another will smoothly animate the map between locations
- The 1.5-second duration provides a nice visual "guide" effect
- Works for both Buy and Rent listings
- Property listings update after the animation completes to show the new city's properties

