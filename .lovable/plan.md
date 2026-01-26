

# Limit Worth Watching to 6 Items Maximum

## Summary

Add a maximum limit of 6 items to the "Worth Watching" section on city area pages. Items are already sorted by `sort_order` from the database, so slicing will preserve the most important factors.

---

## Current Flow

```text
Database (city_market_factors, sorted by sort_order)
    ↓
useCityMarketFactors hook
    ↓
staticFactors array (mapped to MarketFactor format)
    ↓
Combined with dynamic TAMA 38 factor → worthWatching
    ↓
CityWorthWatchingNew component (displays ALL factors)
```

---

## Solution

Apply `.slice(0, 6)` to the `worthWatching` array before passing it to the component.

---

## Changes Required

### File: `src/pages/AreaDetail.tsx`

**Lines 170-173** - Add the slice after combining factors:

```typescript
// Combine database factors and dynamic TAMA 38 factor
const allFactors = tama38Factor 
  ? [...staticFactors.filter(f => !f.title.toLowerCase().includes('tama')), tama38Factor]
  : staticFactors;

// Limit to maximum 6 items (already sorted by sort_order from database)
const worthWatching = allFactors.slice(0, 6);
```

---

## Why This Works

1. **Database ordering preserved**: The `useCityMarketFactors` hook already orders by `sort_order`, so the most important factors come first
2. **TAMA 38 included**: The dynamic TAMA 38 factor is added before slicing, so it counts toward the 6-item limit
3. **Grid alignment**: 6 items creates exactly 2 full rows in the 3-column grid layout

---

## Result

| City | Before | After |
|------|--------|-------|
| Jerusalem | 8 items | 6 items (top 6 by priority) |
| Givat Shmuel | 5 items | 5 items (under limit, unchanged) |
| Herzliya | 3 items | 3 items (under limit, unchanged) |

Cities with 6 or fewer factors are unaffected. Cities with more than 6 will show only the highest-priority items based on their `sort_order`.

