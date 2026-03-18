

## Fix: Room Count Mismatch Between BuyWise and Government Data

### The Problem

BuyWise Israel stores properties with two fields:
- `bedrooms` = sleeping bedrooms (e.g., 4)
- `additional_rooms` = living room, mamad, office, etc. (e.g., 2)

Israeli government data (`sold_transactions`, `city_price_history`, `neighborhood_price_history`) uses a single `rooms` field = total rooms (e.g., 6).

Currently, all market comparison logic passes `property.bedrooms` directly as the room count when querying government data. A 4-bedroom + 2 additional rooms property gets compared against 4-room government transactions instead of 6-room ones. This makes every comparison wrong.

### Solution

**1. Create a shared utility: `src/lib/israeliRoomCount.ts`**

A single function that converts BuyWise's split fields into the Israeli standard room count:

```ts
export function getIsraeliRoomCount(bedrooms: number | null, additionalRooms?: number | null): number | null {
  if (bedrooms == null) return null;
  return bedrooms + (additionalRooms || 0);
}
```

If `additional_rooms` is 0 or null (not provided), it falls back to just bedrooms — which is the safe default for older/imported listings that don't have this field set.

**2. Update MarketIntelligence.tsx** — the main hub that feeds room counts downstream:
- Compute `israeliRooms = getIsraeliRoomCount(property.bedrooms, property.additional_rooms)` (need to add `additional_rooms` to the prop type)
- Pass `israeliRooms` to `useRoomSpecificCityPrice` instead of `property.bedrooms`
- Pass `israeliRooms` to `useNeighborhoodAvgPrice` instead of `property.bedrooms`
- Pass `israeliRooms` to `RecentNearbySales` as `propertyRooms` instead of `property.bedrooms`
- Pass `israeliRooms` to the AI insight payload as the room count for comparisons

**3. Update PropertyValueSnapshot.tsx** — receives `bedrooms` prop for room-specific comparisons:
- Add an `israeliRoomCount` prop (or rename the existing `bedrooms` to clarify)
- Use it for the avg size lookup, city room comparison card, and arnona estimates

**4. Update RecentNearbySales.tsx** — uses `propertyRooms` to filter comps:
- Already receives `propertyRooms` — the fix is upstream (MarketIntelligence passing the right value)
- The `minRooms`/`maxRooms` filter already uses ±1, which will now correctly bracket government room counts

**5. Update the property detail page** to pass `additional_rooms` through to MarketIntelligence:
- Find where `<MarketIntelligence property={...}>` is rendered and ensure `additional_rooms` is included in the property object

**6. Add a comment in each hook** (`useRoomSpecificCityPrice`, `useNeighborhoodAvgPrice`, `useNearbySoldComps`) clarifying that the `rooms` parameter expects Israeli-standard total room count (bedrooms + additional), not BuyWise bedrooms alone.

### Files to Change

| File | Change |
|------|--------|
| `src/lib/israeliRoomCount.ts` | **New** — shared conversion utility |
| `src/components/property/MarketIntelligence.tsx` | Add `additional_rooms` to prop type, compute israeli room count, pass to all downstream |
| `src/components/property/PropertyValueSnapshot.tsx` | Accept and use israeli room count for comparisons |
| `src/components/property/PropertyQuickSummary.tsx` | Pass `additional_rooms` to MarketIntelligence if it's the parent |
| Property detail page (parent) | Ensure `additional_rooms` flows through |
| `src/hooks/useRoomSpecificCityPrice.ts` | Add clarifying comment |
| `src/hooks/useNeighborhoodPrices.ts` | Add clarifying comment |

### What This Fixes
- Nearby sold comps now filter for the correct room range (6±1 instead of 4±1)
- City average comparison uses the right room-specific data (6-room avg, not 4-room)
- Neighborhood average comparison uses correct room count
- AI market insight receives correct room context
- All future features importing this utility will be correct by default

