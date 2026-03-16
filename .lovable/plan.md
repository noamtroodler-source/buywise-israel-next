

## Plan: Consistent "No Data" Communication Across Property Components

### Problem
Several components silently hide when data is missing, instead of keeping the layout consistent and communicating why data isn't available — which goes against the BuyWise "trusted guide" voice.

### Spots to Fix

**1. Rental Snapshot cards (PropertyValueSnapshot.tsx, lines 95-175)**
The rental view still conditionally hides cards 2 ("City Avg") and 3 ("vs Market Rate") when data is missing. Same fix as purchase: always show all 3 cards with "No data yet" fallback and a subtitle like "City rental data unavailable."

**2. NeighborhoodAvgPriceChip (PropertyQuickSummary.tsx, line 82)**
Returns `null` when `priceData?.avg_price` is missing. This one is a small inline chip — not a card. Hiding it is actually fine here since showing "No neighborhood data" as a chip next to the price would be noisy, not helpful. **No change needed.**

**3. MarketIntelligence — no-coordinates guard (MarketIntelligence.tsx, line 207)**
When `hasComps` is false (no lat/lng on the listing), the entire comps section + divider is hidden. The `RecentNearbySales` component already handles its own empty state nicely (line 348-387 — shows a styled empty box with "No nearby sales data yet" + CTA to city page). The issue is `MarketIntelligence` never renders it because of the `hasComps` guard. Fix: remove the `hasComps` guard and always render `RecentNearbySales` — when lat/lng is missing, show a similar styled empty state inside `RecentNearbySales` instead of returning null.

**4. RecentNearbySales — no-coordinates early return (RecentNearbySales.tsx, lines 325-328)**
Currently returns `null` when no lat/lng. Change to render an empty state card: "Location data not available for this listing — nearby sales comparison requires coordinates." with the same CTA to explore city data.

### Files Changed

| File | Change |
|------|--------|
| `PropertyValueSnapshot.tsx` | Rental view: always show 3 cards, "No data yet" fallbacks for cards 2 & 3 |
| `MarketIntelligence.tsx` | Remove `hasComps` conditional wrapper — always render divider + comps section |
| `RecentNearbySales.tsx` | Replace `return null` for missing coords with styled empty state card |

### Not changing
- `NeighborhoodAvgPriceChip` — inline chip, hiding is appropriate
- `AIMarketInsight` — returns null when no insight generated, but this is downstream of comps; once comps section always renders, insight will too when available
- `AffordabilityBadge` — contextual badge, only relevant when user has saved budget settings

