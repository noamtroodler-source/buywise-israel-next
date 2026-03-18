

## Plan: Average last 4 quarters for neighborhood comparison + update tooltip

### Problem
The neighborhood comparison currently uses only the **latest single quarter's** `avg_price_nis`. The tooltip says "3 years of" transactions. Both should reflect **1 year** (last 4 quarters averaged).

### Changes

**1. `src/hooks/useNeighborhoodPrices.ts`** — Average last 4 quarters instead of using just `prices[0]`

Currently (line 111-114):
```ts
const latest = prices[0];
const latestPrice = latest.avg_price_nis;
```

Change to: take up to 4 most recent quarters, average their `avg_price_nis`:
```ts
const recentPrices = prices.slice(0, 4).filter(p => p.avg_price_nis);
const avgPrice = recentPrices.length > 0
  ? Math.round(recentPrices.reduce((sum, p) => sum + p.avg_price_nis, 0) / recentPrices.length)
  : null;
```

Use `avgPrice` instead of `latestPrice` for `avg_price` and `avg_price_sqm`. Keep trend calculation unchanged (still 3-year comparison for the trend card).

**2. `src/components/property/PropertyValueSnapshot.tsx`** (line 260) — Update tooltip text

Change `'3 years of'` → `'the past year of'` for neighborhood comparisons:
```
based on {isNeighborhoodComparison ? 'the past year of' : 'recent'} government-recorded transactions
```

Two files, small targeted changes.

