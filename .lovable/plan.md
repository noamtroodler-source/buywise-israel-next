
## Why the Auto-Detection is Glitchy (Root Cause Analysis)

The current implementation has a critical flaw that causes the "glitchy" behavior when panning between cities:

### The Problem: Cascading State Updates

Every time you pan or zoom the map, this happens:

1. `handleBoundsChange` is called with new bounds/center/zoom
2. The function checks if zoom >= 12 and tries to detect a city
3. If a city is detected, it calls `setFilters()` and `updateUrlParams()`
4. These state changes trigger React re-renders
5. The URL update causes `useSearchParams` to change
6. This can cause additional re-renders and callback recreations
7. Meanwhile, you're still panning, so `handleBoundsChange` is called again
8. The cycle repeats rapidly, causing visual "flickering" and laggy behavior

### Additional Issues

1. **5km radius is too restrictive** - The current 5km threshold means as you pan between cities, the filter rapidly switches between detected/undefined, causing the listings to flash between "City X listings" and "All listings in viewport"

2. **Callback dependency array includes `filters`** - The `handleBoundsChange` callback depends on `filters`, which means every time filters change (including when auto-detection changes the city), the callback is recreated, potentially causing stale closure issues

3. **No debouncing on city detection** - While map bounds are debounced (300ms), the city detection runs immediately on every update

4. **URL updates on every detection** - Changing the URL on every city detection causes extra re-renders and can interfere with the user's current navigation

---

## Recommended Solution: Simplify the Approach

Based on the complexity and issues, here's a cleaner approach:

### Option A: Remove Auto-Detection (Simpler, More Reliable)

Remove the automatic city detection and keep the city filter as an explicit user action. The map already shows the correct properties based on viewport bounds - the city filter is really just a convenience for the dropdown display.

**Benefits:**
- No glitchy behavior during panning
- Cleaner, more predictable UX
- Map bounds still drive property queries correctly

**Trade-off:**
- City dropdown won't auto-update when panning into a new area

### Option B: Lightweight Auto-Detection (Debounced, Non-Blocking)

Keep auto-detection but make it much less intrusive:

1. **Increase debounce significantly** - Only detect city after 800ms of no movement (user "settled" in an area)
2. **Don't update URL for auto-detection** - Only update the filter state, not the URL (reduces re-renders)
3. **Add hysteresis** - Only change city if the detected city is different for 2+ consecutive checks (prevents rapid flickering between cities at boundaries)
4. **Remove filters dependency** - Store detected city in a separate ref to avoid callback recreation

---

## Implementation Plan (Option B - Improved Auto-Detection)

### File: `src/components/map-search/MapSearchLayout.tsx`

#### 1. Add Dedicated Debounce for City Detection

Create a separate debounced city detection that runs after the user stops moving:

```typescript
const cityDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
const lastDetectedCityRef = useRef<string | null>(null);
```

#### 2. Simplify `handleBoundsChange`

Remove city detection logic from `handleBoundsChange` and schedule it separately:

```typescript
const handleBoundsChange = useCallback((bounds: MapBounds, center: [number, number], zoom: number) => {
  setMapBounds(bounds);
  
  if (isProgrammaticMoveRef.current) return;
  
  setMapCenter(center);
  setMapZoom(zoom);
  
  // Schedule city detection (debounced separately)
  if (cityDetectionTimeoutRef.current) {
    clearTimeout(cityDetectionTimeoutRef.current);
  }
  
  cityDetectionTimeoutRef.current = setTimeout(() => {
    detectAndUpdateCity(center, zoom);
  }, 800); // Wait 800ms after user stops moving
}, []); // No filter dependencies - much more stable
```

#### 3. Create Separate City Detection Function

```typescript
const detectAndUpdateCity = useCallback((center: [number, number], zoom: number) => {
  if (!allCities) return;
  
  if (zoom >= 12) {
    const detectedCity = findCityByCoordinates(center[0], center[1]);
    
    // Only update if different from LAST detected (not current filter)
    // This prevents flickering when filter was set by other means
    if (detectedCity !== lastDetectedCityRef.current) {
      lastDetectedCityRef.current = detectedCity;
      
      if (detectedCity) {
        setFilters(prev => ({ ...prev, city: detectedCity }));
        // Note: NOT updating URL here to reduce re-renders
      }
    }
  } else if (zoom < 12) {
    // Zoomed out - clear city filter
    if (lastDetectedCityRef.current !== null) {
      lastDetectedCityRef.current = null;
      setFilters(prev => ({ ...prev, city: undefined }));
    }
  }
}, [allCities, findCityByCoordinates]);
```

#### 4. Increase Detection Radius

Change from 5km to 10km for more stable detection near city boundaries:

```typescript
const MAX_DISTANCE_KM = 10; // Was 5, now more tolerant
```

---

## Summary of Changes

| Change | Reason |
|--------|--------|
| Add 800ms debounce for city detection | Prevents rapid updates while actively panning |
| Remove `filters` from `handleBoundsChange` dependencies | Prevents callback recreation on every filter change |
| Don't update URL on auto-detection | Reduces re-renders and navigation interference |
| Track "last detected city" in a ref | Prevents redundant state updates |
| Increase detection radius to 10km | More stable detection at city boundaries |
| Clean up timeout on unmount | Prevent memory leaks |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map-search/MapSearchLayout.tsx` | Refactor city detection to be debounced and non-blocking |

---

## Expected Result

After this fix:
- Panning/zooming will feel smooth with no "glitchy" flickering
- City filter will update ~800ms after you stop moving in a new city area
- The right-side listings update based on viewport (unchanged, already works)
- Explicit city dropdown selection still works with smooth animations (unchanged)
