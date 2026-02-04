

## Zoom Out to Israel When City is Cleared

### The Problem

When you clear the city filter (deselect the currently selected city), the map stays at the current location instead of zooming back out to show all of Israel.

The current logic in `handleFiltersChange` only handles the case when a **new city is selected**:
```typescript
const cityChanged = newFilters.city && newFilters.city !== filters.city;
```

This condition is `false` when `newFilters.city` is `undefined` (cleared), so the zoom-out logic is never triggered.

### The Solution

Add a check for when the city is **cleared** (was set, now is `undefined`) and fly the map back to the national view of Israel:

1. Detect when `filters.city` had a value but `newFilters.city` is now `undefined`
2. Set map center to `ISRAEL_CENTER` (31.5, 34.8)
3. Set zoom to `ISRAEL_ZOOM` (8)
4. Use the same smooth `flyTo` animation

---

## Technical Changes

### Update `handleFiltersChange` in `MapSearchLayout.tsx`

```typescript
const handleFiltersChange = useCallback((newFilters: PropertyFiltersType) => {
  const updatedFilters = { ...newFilters, listing_status: listingStatus };
  
  // Check if city was CLEARED (had a value, now undefined)
  const cityCleared = filters.city && !newFilters.city;
  if (cityCleared) {
    // Zoom back out to show all of Israel
    const nextCenter = ISRAEL_CENTER;
    const nextZoom = ISRAEL_ZOOM;
    setMapCenter(nextCenter);
    setMapZoom(nextZoom);
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters, nextCenter, nextZoom);
    return;
  }
  
  // If city changed to a NEW city, fly to that city
  const cityChanged = newFilters.city && newFilters.city !== filters.city;
  if (cityChanged) {
    // ... existing city zoom logic ...
  }

  // Default: no special map view update
  setFilters(updatedFilters);
  updateUrlParams(updatedFilters);
}, [listingStatus, updateUrlParams, filters.city, allCities]);
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/map-search/MapSearchLayout.tsx` | Add city-cleared check in `handleFiltersChange` to zoom back to Israel |

---

## Result

After this change:
- Selecting a city zooms the map to that city (existing behavior)
- Clearing the city filter smoothly zooms the map back out to show all of Israel
- The same 1.5-second `flyTo` animation provides a smooth transition
- Works from the City filter dropdown clear action

