

## Plan: Switch "vs City Avg" card to "vs Neighborhood Avg" (3-year window)

### What Changes

The middle card in `PropertyValueSnapshot` (purchase view) currently shows **"vs {City} Avg"** using city-level CBS price data. We'll change it to show **"vs {Neighborhood} Avg"** using the existing neighborhood CBS mapping system, with a 3-year comparison window. Falls back to city avg when neighborhood data isn't available.

### Data Flow

The `useNeighborhoodAvgPrice` hook already returns `avg_price` (absolute price for 4-room apartments) and `yoy_change_percent` (already computed as 3-year growth). We need to:

1. **Extend `useNeighborhoodPrices` to support room-specific lookups** — currently hardcoded to `rooms: 4`. Pass the property's room count so comparisons are apples-to-apples (e.g., 3-room listing vs 3-room neighborhood avg).

2. **Compute neighborhood price-per-sqm** — divide `avg_price` by the standard size for that room count (`AVG_SIZE_BY_ROOMS`: 3→75, 4→100, 5→130), same approach already used in `useRoomSpecificCityPrice`.

3. **Pass neighborhood data into `PropertyValueSnapshot`** — new props: `neighborhoodAvgPriceSqm`, `neighborhoodName`. When present, the middle card shows "vs {Neighborhood} Avg" instead of "vs {City} Avg".

4. **Fallback chain**: Neighborhood avg → City room-specific avg → Generic city avg → "No data yet"

### Files Modified

**`src/hooks/useNeighborhoodPrices.ts`**
- Add optional `rooms` parameter to `useNeighborhoodPrices` (default 4 for backward compat)
- `useNeighborhoodAvgPrice` accepts `rooms` param, passes through
- Return `avg_price_sqm` alongside `avg_price` (computed via `AVG_SIZE_BY_ROOMS` divisor)

**`src/components/property/MarketIntelligence.tsx`**
- Call `useNeighborhoodAvgPrice(property.city, property.neighborhood, property.bedrooms)`
- Compute `effectiveAvgPriceSqm`: neighborhood avg sqm → city room-specific → city generic
- Pass `neighborhoodName` and `neighborhoodAvgPriceSqm` to `PropertyValueSnapshot`
- Keep city avg as separate fallback prop

**`src/components/property/PropertyValueSnapshot.tsx`**
- Add props: `neighborhoodAvgPriceSqm`, `neighborhoodName`
- Middle card logic:
  - If `neighborhoodAvgPriceSqm` exists → label "vs {neighborhoodName} Avg", compare against it, subtitle shows neighborhood per-sqm
  - Else → current city behavior (unchanged)
- Tooltip updated to explain "3-year average from government transaction data"
- `roomCount` label still applies (e.g., "vs Arnona 4-Room Avg")

**`src/pages/PropertyDetail.tsx`**
- Pass `neighborhood` through to the standalone `PropertyValueSnapshot` usage (if applicable)

### Display Example

When neighborhood data exists:
```
vs Arnona 4-Room Avg
-8%
Arnona: ₪32,400/m²
```

When only city data exists (current behavior, unchanged):
```
vs Jerusalem 4-Room Avg
+4%
Jerusalem: ₪28,500/m²
```

### What Stays the Same
- Card 1 (This Property price/m²) — no change
- Card 3 (12-Month Trend) — no change, still city-level
- Rental cards — no change
- `NeighborhoodAvgPriceChip` in `PropertyQuickSummary` — no change

