
# Backfill Coordinates for All Mock Properties

## Current Status

| Metric | Value |
|--------|-------|
| Total properties | 3,108 |
| Missing coordinates | 2,491 (80%) |
| Cities affected | 25 (all of them) |

## The Problem

The `seed-additional-properties` function creates mock properties with `latitude: null, longitude: null` (lines 224-225). The existing `backfill-coordinates` function uses Nominatim (OpenStreetMap) which:
- Has a 1.1-second rate limit per request
- Would take ~45+ minutes for 2,491 properties
- Often fails for Israeli street addresses

## The Solution: City-Center + Random Offset

Use pre-defined city center coordinates and add a random offset (0.5-3km radius) for each property. This:
- Runs instantly (no external API calls)
- Places properties realistically within each city
- Works 100% reliably for all properties

### Implementation

**Create a new backfill function** that:
1. Contains a lookup table of Israeli city center coordinates
2. For each property missing coordinates:
   - Get city center lat/lng
   - Add random offset (±0.01 to ±0.03 degrees ≈ 1-3km)
   - Update the property

### City Coordinates Lookup (sample)

```typescript
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Tel Aviv': { lat: 32.0853, lng: 34.7818 },
  'Jerusalem': { lat: 31.7683, lng: 35.2137 },
  'Haifa': { lat: 32.7940, lng: 34.9896 },
  'Herzliya': { lat: 32.1663, lng: 34.8434 },
  'Ramat Gan': { lat: 32.0833, lng: 34.8100 },
  'Mevaseret Zion': { lat: 31.8022, lng: 35.1500 },
  // ... all 25+ cities
};
```

### Random Offset Logic

```typescript
// Add random offset of ~1-3km
function addRandomOffset(lat: number, lng: number) {
  const offsetLat = (Math.random() - 0.5) * 0.04; // ±0.02 degrees ≈ ±2km
  const offsetLng = (Math.random() - 0.5) * 0.04;
  return {
    lat: lat + offsetLat,
    lng: lng + offsetLng
  };
}
```

## Files to Change

| File | Changes |
|------|---------|
| `supabase/functions/backfill-coordinates/index.ts` | Add city coordinates lookup, new `useLocalCoords` mode |

## Execution

After updating the function, I'll call it with a higher limit to process all ~2,500 properties in batches (the function will process them internally in database batches).

## Benefits

1. **Instant** - No external API calls
2. **100% success rate** - All properties get coordinates
3. **Realistic** - Properties scattered within city boundaries
4. **Free** - No Google Maps API costs
5. **Idempotent** - Can run multiple times safely

## Also Fix: Seed Function

I'll update `seed-additional-properties` to use the same city coordinates lookup, so future mock data is created with coordinates from the start.
