
## Auto-Detect City When Zooming Into Map Area

### What You're Asking For

When you're viewing Ashdod and manually zoom out, then zoom back into Jerusalem, you want:
1. The properties on the right side to update to show Jerusalem listings
2. The city filter dropdown (top left) to automatically update to "Jerusalem"

Currently, the system only updates the city filter when you explicitly select a city from the dropdown or click on a city overlay marker. Manual panning/zooming updates the listings via map bounds, but it doesn't sync the city filter.

---

### How It Will Work

When you zoom into a specific city area (zoom level ≥12), the system will:

1. **Detect the city** - Compare the map's center coordinates against all known city centers and find the closest match within a reasonable radius (~5km)
2. **Update the city filter** - If a city is detected and it's different from the current filter, automatically update the city dropdown
3. **Sync URL and state** - The URL and filter bar will reflect the detected city

The detection will only trigger when:
- Zoom level is 12 or higher (zoomed in enough to be viewing a single city)
- The map center is within ~5km of a city center
- The detected city is different from the current filter (to avoid unnecessary updates)
- It's a user-initiated pan/zoom (not during programmatic city-to-city animations)

---

### Technical Implementation

#### 1. Add City Detection Logic in `MapSearchLayout.tsx`

Create a helper function to find the closest city to given coordinates:

```typescript
// Helper: Find closest city to given coordinates
const findCityByCoordinates = useCallback((lat: number, lng: number): string | null => {
  if (!allCities) return null;
  
  const MAX_DISTANCE_KM = 5; // Only match if within 5km of city center
  let closestCity: string | null = null;
  let minDistance = Infinity;
  
  for (const city of allCities) {
    if (!city.center_lat || !city.center_lng) continue;
    
    // Simple distance calculation (Haversine approximation for small distances)
    const distanceKm = getDistanceInMeters(
      [lng, lat], 
      [city.center_lng, city.center_lat]
    ) / 1000;
    
    if (distanceKm < minDistance && distanceKm < MAX_DISTANCE_KM) {
      minDistance = distanceKm;
      closestCity = city.name;
    }
  }
  
  return closestCity;
}, [allCities]);
```

#### 2. Add City Auto-Detection in `handleBoundsChange`

When bounds change (user pans/zooms), check if we should update the city filter:

```typescript
const handleBoundsChange = useCallback((bounds: MapBounds, center: [number, number], zoom: number) => {
  // Always update mapBounds for property queries
  setMapBounds(bounds);
  
  // Skip updates during programmatic moves
  if (isProgrammaticMoveRef.current) return;
  
  setMapCenter(center);
  setMapZoom(zoom);
  
  // Auto-detect city when zoomed in (zoom ≥ 12)
  if (zoom >= 12 && allCities) {
    const detectedCity = findCityByCoordinates(center[0], center[1]);
    
    // Only update if detected city is different from current filter
    if (detectedCity && detectedCity !== filters.city) {
      // Update filters with detected city (without triggering map fly)
      const updatedFilters = { ...filters, city: detectedCity, listing_status: listingStatus };
      setFilters(updatedFilters);
      updateUrlParams(updatedFilters, center, zoom);
    }
    
    // Clear city filter if zoomed in but not near any city center
    if (!detectedCity && filters.city) {
      const updatedFilters = { ...filters, city: undefined, listing_status: listingStatus };
      setFilters(updatedFilters);
      updateUrlParams(updatedFilters, center, zoom);
    }
  }
  
  // If zoomed out (< 12), clear city filter to show all cities
  if (zoom < 12 && filters.city) {
    const updatedFilters = { ...filters, city: undefined, listing_status: listingStatus };
    setFilters(updatedFilters);
    updateUrlParams(updatedFilters, center, zoom);
  }
}, [filters, listingStatus, allCities, findCityByCoordinates, updateUrlParams]);
```

#### 3. Prevent Infinite Loops

The key challenge is preventing the city auto-detection from triggering a map fly animation (which would create a loop). The solution:

- When detecting a city from pan/zoom, update `filters` and URL **without** setting `mapCenter`/`mapZoom` (since those are already correct from the user's pan)
- Only use the `isProgrammaticMoveRef` pattern for explicit city dropdown selections

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/map-search/MapSearchLayout.tsx` | Add `findCityByCoordinates` helper and city auto-detection logic in `handleBoundsChange` |

---

### User Experience

| Scenario | Behavior |
|----------|----------|
| Viewing Ashdod, zoom out | City filter clears, shows national view with city overlays |
| Zoom in on Jerusalem area | City filter updates to "Jerusalem", listings show Jerusalem properties |
| Pan slightly within Jerusalem | No change (still detecting Jerusalem) |
| Pan to border area between cities | Whichever city center is closer gets selected |
| Select city from dropdown | Map flies to that city (existing behavior) |

---

### Edge Cases Handled

1. **Rapid panning**: Debounced via existing 300ms timeout in `MapBoundsListener`
2. **No city nearby**: If you zoom into an area without a known city (e.g., desert), the city filter stays cleared
3. **City filter sync**: Both dropdown selection AND manual zoom will keep the filter in sync
4. **Works with Buy/Rent toggle**: Detection works for both listing types
