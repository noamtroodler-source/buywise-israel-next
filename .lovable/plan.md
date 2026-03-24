

# Property Price Tier System — Full Implementation

## Overview

Add a city-wide price tier classification (Standard / Premium / Luxury) computed from `sold_transactions` percentiles. The tier label appears on listings and comparison cards adapt their language to compare against the same tier, eliminating misleading "overpriced" signals for premium properties.

## Architecture

```text
sold_transactions (17K records, price_per_sqm exists)
        │
        ▼
DB Function: get_city_price_tiers(city, rooms)
  → Returns p33, p67 percentile thresholds
  → Classifies any price_per_sqm into Standard/Premium/Luxury
        │
        ▼
DB Function: get_nearby_sold_comps_tiered(...)
  → Same as get_nearby_sold_comps + filters to same tier
  → Also returns tier_label, tier_avg_price_sqm
        │
        ▼
New Hook: usePriceTier(city, rooms, propertyPriceSqm)
  → Returns { tier, tierAvgPriceSqm, tierLabel, minThreshold }
        │
        ▼
UI: MarketIntelligence, PropertyValueSnapshot, MarketVerdictBadge
  → Shows tier badge, compares against tier avg
```

## Step 1 — Database Function: `get_city_price_tiers`

New SQL function that computes percentile boundaries from `sold_transactions` for a given city + room count (±1 room tolerance). Returns the 33rd and 67th percentile of `price_per_sqm` from transactions in the last 24 months.

**Minimum data gate**: requires 20+ transactions in that city/room combo. Returns NULL if insufficient data (UI falls back to current behavior).

```sql
CREATE FUNCTION get_city_price_tiers(
  p_city TEXT,
  p_rooms INTEGER DEFAULT NULL,
  p_months_back INTEGER DEFAULT 24
) RETURNS TABLE(
  p33_price_sqm NUMERIC,
  p67_price_sqm NUMERIC,
  transaction_count INTEGER,
  tier_for_price_sqm NUMERIC  -- pass in via separate call
)
```

Actually, simpler approach — a single function that returns the tier boundaries:

```sql
get_city_price_tiers(p_city, p_rooms, p_months_back)
→ { p33_price_sqm, p67_price_sqm, transaction_count }
```

Client-side classification:
- `price_per_sqm ≤ p33` → Standard
- `price_per_sqm ≤ p67` → Premium  
- `price_per_sqm > p67` → Luxury

## Step 2 — New Hook: `usePriceTier`

```typescript
// src/hooks/usePriceTier.ts
usePriceTier(city, rooms, propertyPriceSqm)
→ { tier: 'standard'|'premium'|'luxury'|null, 
    tierAvgPriceSqm, p33, p67, transactionCount }
```

- Calls `get_city_price_tiers` RPC
- Classifies the property into a tier
- Also computes the average price_per_sqm within that tier from the same function (or a second query filtering sold_transactions to that price range)
- Returns `null` when transaction count < 20 (fallback to current behavior)

## Step 3 — Modify `get_nearby_sold_comps` (or create tiered variant)

Add optional `p_min_price_sqm` and `p_max_price_sqm` parameters to the existing function. When provided, filters comps to the same price tier. This keeps backward compatibility — existing calls without these params work exactly as before.

## Step 4 — UI Integration

### A. Tier Badge on Property Detail
In `MarketIntelligence.tsx`, show a small badge next to the price:
- Standard → no badge (default, no noise)
- Premium → `Premium` badge (muted blue/indigo)
- Luxury → `Luxury` badge (gold/amber accent)

Design: small rounded pill, consistent with existing Badge component. Uses subtle brand-appropriate colors (not garish).

### B. PropertyValueSnapshot Cards
- Card 2: Changes from "vs {City} Avg" → "vs {City} Premium Avg" (or Luxury Avg)
- Card 3: Changes from "vs {City} N-Room Avg" → "vs {City} N-Room Premium Avg"
- Tooltip explains: "Comparing against properties in the same price tier"
- When tier data unavailable (< 20 transactions), falls back to current all-market averages

### C. MarketVerdictBadge
- Uses tier-filtered comp averages for the verdict
- Premium/Luxury context lines removed (no longer needed — comparison is apples-to-apples)
- The `isPremiumSegment` hack gets replaced by proper tier classification

### D. RecentNearbySales
- Nearby comps list stays geographic (all tiers) — this is evidence, not comparison
- Individual comp badges unchanged
- Summary verdict uses tier-aware average from the new hook

## Step 5 — Edge Cases & Fallbacks

| Scenario | Behavior |
|---|---|
| City has < 20 transactions for room count | Tier = null, fall back to current all-market comparison |
| Property has no size_sqm | Can't compute price_per_sqm → no tier, current behavior |
| Room count outside 3-5 range | Use ±1 room tolerance in DB query, or all rooms if very sparse |
| All transactions in a city are similar price | Tiers become meaningless but still technically work (thirds of similar values) |

## Files Changed

1. **New migration** — `get_city_price_tiers` DB function
2. **Migration** — modify `get_nearby_sold_comps` to accept optional price_sqm filters
3. **New file**: `src/hooks/usePriceTier.ts`
4. **Edit**: `src/hooks/useNearbySoldComps.ts` — add optional tier price filter params
5. **Edit**: `src/components/property/MarketIntelligence.tsx` — integrate tier hook, pass tier data to children, show tier badge
6. **Edit**: `src/components/property/PropertyValueSnapshot.tsx` — accept tier props, update card labels and comparisons
7. **Edit**: `src/types/soldTransactions.ts` — add tier type if needed

## Visual Design

- Tier badges use the existing `Badge` component
- **Standard**: no badge shown (avoid labeling most properties)
- **Premium**: `bg-blue-50 text-blue-700 border-blue-200` (dark mode: `bg-blue-950/40 text-blue-300`)
- **Luxury**: `bg-amber-50 text-amber-700 border-amber-200` (dark mode: `bg-amber-950/40 text-amber-300`)
- Small, non-intrusive — placed near the price or in the Market Intelligence header
- Comparison cards subtly update their labels but keep the same grid layout

