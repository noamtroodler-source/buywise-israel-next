
# Update MarketStatsCards.tsx to Use Shared Constants

## Overview

This is a simple update to replace the locally defined `NATIONAL_AVG_PRICE_SQM` constant with an import from the shared constants file, ensuring full consistency across all components.

---

## Current State

**File:** `src/components/city/MarketStatsCards.tsx`

**Lines 11-13:**
```tsx
// National average for context (Israel-wide benchmark)
const NATIONAL_AVG_PRICE_SQM = 22800;
const NATIONAL_AVG_YIELD = 2.8;
```

**Issue:** The local constant uses `22800` while the shared constant in `@/lib/constants/marketAverages` uses `32000`.

---

## Changes Required

### 1. Add Import Statement

Add import from the shared constants file after line 9:

```tsx
import { NATIONAL_AVG_PRICE_SQM } from '@/lib/constants/marketAverages';
```

### 2. Remove Local NATIONAL_AVG_PRICE_SQM

Remove line 12 (`const NATIONAL_AVG_PRICE_SQM = 22800;`), keeping only the `NATIONAL_AVG_YIELD` constant which is not in the shared file:

```tsx
// National average for context (Israel-wide benchmark)
const NATIONAL_AVG_YIELD = 2.8;
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/city/MarketStatsCards.tsx` | Import `NATIONAL_AVG_PRICE_SQM` from shared constants, remove local definition |

---

## Result

After this change:
- The national average benchmark in the "National Context Benchmark" footer will display `₪32K/m²` instead of `₪22.8K/m²`
- Full consistency with `CityQuickStats.tsx` and `MarketOverviewCards.tsx`
- All components now use the same centralized constant
