

## Fix Data Gaps: Room-Specific Fallback + Batch Geocode Sold Transactions

### Problem Summary

Two data gaps cause most listings to show "No data yet":

1. **City avg price box**: `city_price_history` only has 3, 4, 5-room data. Listings with 6+ Israeli rooms (common — e.g. 4 bedrooms + 2 additional) get nothing. Also, rooms 1-2 get nothing.
2. **Recently Sold Comps**: Only ~5-11% of sold_transactions are geocoded (e.g. Ashkelon: 102/3025, Jerusalem: 116/2148). The RPC requires lat/lng, so ~89% of transactions are invisible.

### Plan

#### Part 1: Room-Specific Price Fallback (code change)

**File:** `src/hooks/useRoomSpecificCityPrice.ts`

- Change the `supported` guard from `rooms >= 3 && rooms <= 5` to `rooms >= 1` (allow any room count)
- When the exact room count isn't in `city_price_history` (e.g. 6, 7, or 1, 2 rooms):
  - If rooms > 5: query for `rooms = 5` as the closest proxy, then scale the average price by a size ratio (using `AVG_SIZE_BY_ROOMS` extended with estimates for 6, 7, 8)
  - If rooms < 3: query for `rooms = 3` as the closest proxy
- Add a `isFallback` flag to the return type so the UI can indicate "Based on 5-room city average" vs exact match
- Update the price/sqm label in `MarketIntelligence.tsx` to show the fallback note

**File:** `src/components/property/MarketIntelligence.tsx`
- When `roomPrice?.isFallback` is true, adjust the subtitle (e.g. "Based on nearest room type") so users know it's approximate

#### Part 2: Batch Geocode Edge Function (new edge function)

**File:** `supabase/functions/batch-geocode-sold/index.ts`

Create a new edge function that geocodes sold_transactions in larger batches, designed to be called repeatedly (admin-triggered or scheduled) to work through the backlog:

- Accepts `{ city?: string, batchSize?: number }` (default batch 200)
- Uses Google Maps API (primary) with Nominatim fallback — same logic as existing `geocode-sold-transaction`
- Processes in parallel (5 concurrent) with rate limiting
- Returns progress: `{ total, geocoded, failed, remaining }`
- Admin-only (same auth pattern as existing geocode function)

This is essentially an optimized version of the existing `geocode-sold-transaction` function that:
- Processes larger batches (200 vs 50)
- Uses parallel requests (5 concurrent vs sequential)
- Prioritizes cities with the most un-geocoded records

#### Part 3: Admin UI trigger

**File:** `src/components/admin/SoldDataManager.tsx` (or wherever the admin import UI lives)

- Add a "Batch Geocode" button that calls the new edge function
- Show progress: "Geocoded X/Y transactions in [city]"
- Allow selecting a city or "all cities"

### Impact

- **Part 1** immediately fixes the "No data yet" for 6+ room listings (and 1-2 room) — pure frontend, no data needed
- **Parts 2-3** progressively fill the geocoding gap — each batch run geocodes ~200 more transactions, improving comp coverage over time

### Technical Notes

- The existing `geocode-sold-transaction` function already has the geocoding logic; Part 2 extends it with parallelism and larger batches
- Google Maps API key is already configured as a secret
- No database migrations needed

