

## Plan: Neighborhood-first comparison with city fallback (both 1-year averaged)

### What changes

**1. `useRoomSpecificCityPrice.ts`** — Average last 4 quarters instead of using only `data[0]`

Currently uses `latest.avg_price_nis` (single quarter). Change to average up to 4 most recent quarters' `avg_price_nis`, then derive `avgPriceSqm` from that average. YoY and 5-year change logic stays the same.

**2. `PropertyValueSnapshot.tsx`** — Fix labels

- Keep the existing fallback chain: neighborhood → city (line 100: `neighborhoodAvgPriceSqm ?? averagePriceSqm`)
- Remove `roomCount` from the card label entirely — no more "5-Room" text
- When showing neighborhood: label = `vs {neighborhoodName} Avg`
- When falling back to city: label = `vs {city} Avg`
- Update tooltip for both cases to say "based on the past year of government-recorded transactions"

**3. `useNeighborhoodPrices.ts`** — Already done

The neighborhood hook already averages last 4 quarters (changed in previous edit). No further changes needed.

### Summary of data flow
- **Neighborhood available**: property ₪/sqm vs neighborhood 4-quarter avg ₪/sqm → `vs {Neighborhood} Avg`
- **No neighborhood data**: property ₪/sqm vs city 4-quarter avg ₪/sqm → `vs {City} Avg`
- No room-count labels anywhere on this card

