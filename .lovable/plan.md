

# Fix Card 3 Fallback: Room-Specific → Neighborhood → City Avg

## Problem
Card 3 in PropertyValueSnapshot shows "No data yet" for properties outside the 3-5 room range (like the 2-room Jerusalem apartment in the screenshot). The data for fallbacks already exists but isn't wired up.

## Fallback Chain
1. **Room-specific CBS price** (current — works for 3-5 rooms)
2. **Neighborhood avg price/sqm × property size** (data exists in MarketIntelligence as `neighborhoodAvgPriceSqm` but never passed to Card 3)
3. **City avg price/sqm × property size** (data exists as `averagePriceSqm` prop)

## Changes

### File 1: `src/components/property/MarketIntelligence.tsx`
- Pass `neighborhoodAvgPriceSqm` and `property.neighborhood` as new props to `PropertyValueSnapshot`

### File 2: `src/components/property/PropertyValueSnapshot.tsx`
- Add `neighborhoodAvgPriceSqm` and `neighborhood` props
- Update Card 3 logic: when `roomSpecificCityAvgPrice` is null, compute fallback total price from `neighborhoodAvgPriceSqm * sizeSqm` (if available) or `averagePriceSqm * sizeSqm` (city fallback)
- Update label to reflect which source is used: "vs [Neighborhood] Avg" or "vs [City] Avg" with appropriate tooltip text
- No more "No data yet" — there will almost always be a city avg available

