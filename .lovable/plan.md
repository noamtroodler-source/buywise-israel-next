

# Replace Red with Amber on Comp Comparison Badges

## What changes

Two identical comp badge blocks in `RecentNearbySales.tsx` (lines ~138-144 and ~572-578) use `bg-semantic-red` when the listing is above a comp sale. Replace with amber, matching the new MarketVerdictBadge philosophy of "no red, max severity is amber."

Also add tiered coloring for the "above" case to match the recalibrated ranges:
- **≤2%** → neutral muted (unchanged)
- **Below (negative)** → green (unchanged)  
- **Above 0-12%** → neutral/muted (normal asking-price gap)
- **Above 12-20%** → amber
- **Above 20%+** → amber (same shade, just factual)

## Files changed

**`src/components/property/RecentNearbySales.tsx`** — Two locations (desktop ~line 138, mobile/carousel ~line 572):
- Replace `bg-semantic-red text-semantic-red-foreground` with `bg-semantic-amber text-semantic-amber-foreground`
- Add intermediate tier: 0-12% above uses neutral muted instead of amber
- Update wording for small gaps: "Listing is X% above this sale" stays factual but color is softer

