

# Phase N2: Fallback Data Labels, Non-CBS City Disclosure & Duplicate Cleanup

---

## Overview

Phase N2 addresses three issues: neighborhoods showing identical city-average data without labels, cities with no CBS coverage still referencing CBS, and duplicate mappings in Ashkelon.

---

## 1. Fallback Detection in Data Hook

**`src/hooks/useNeighborhoodPriceTable.ts`** — After building the final rows array (line ~146), detect fallback data: if 3+ rows share the exact same `avg_price`, flag them with `is_fallback: true`.

Add `is_fallback` to the `NeighborhoodPriceRow` interface.

## 2. Fallback Labels in UI

**`src/components/city/CityNeighborhoodPriceTable.tsx`**:
- In the drawer table rows, show a muted "(City avg)" badge next to neighborhoods flagged `is_fallback`
- Reduce visual weight of fallback rows with `opacity-60`

**`src/components/city/CityNeighborhoods.tsx`**:
- Add `is_fallback?: boolean` to `UnifiedNeighborhood` interface
- Show "(City avg)" tag on neighborhood cards when flagged

**`src/components/city/NeighborhoodDetailDialog.tsx`**:
- When the neighborhood has `is_fallback`, show an info note below the price: "City-average price shown — neighborhood-specific data unavailable"

**`src/pages/AreaDetail.tsx`** — Pass through `is_fallback` when building `UnifiedNeighborhood` objects from price table data.

## 3. Non-CBS City Constant & Conditional Attribution

**`src/lib/constants/cbsCoverage.ts`** (new file) — Export:
```
NON_CBS_CITIES = ['Eilat', 'Givat Shmuel', 'Hod HaSharon', 'Pardes Hanna', 'Zichron Yaakov', "Ma'ale Adumim", 'Efrat', 'Caesarea', "Ra'anana"]
```

**`src/components/city/CitySourceAttribution.tsx`**:
- Import `NON_CBS_CITIES`
- When `cityName` is in the list, adjust the methodology text to say "All price data from aggregated market transaction records" instead of mentioning CBS

**`src/components/city/PriceByApartmentSize.tsx`** line 480:
- Import `NON_CBS_CITIES`
- Conditional: if city is non-CBS, show `sources={{ 'Market Data': 'Aggregated transaction records' }}` instead of `{{ CBS: '...' }}`

## 4. Remove Duplicate Ashkelon Mappings (Database)

Delete the Hebrew-parenthetical duplicates from `neighborhood_cbs_mappings`:
- "Afridar (אפרידר)" — duplicate of "Afridar"
- "Barnea (ברניע)" — duplicate of "Barnea"
- "City Center (מרכז העיר)" — duplicate of "City Center"
- "Marina (מרינה)" — duplicate of "Marina"
- "Neve Dekalim (נווה דקלים)" — duplicate of "Neve Dekalim"

These cause double-counting in price averages.

## Execution Order

1. Create `cbsCoverage.ts` constant file
2. Update `useNeighborhoodPriceTable.ts` — add fallback detection + `is_fallback` field
3. Update `CityNeighborhoods.tsx` — add `is_fallback` to interface
4. Update `AreaDetail.tsx` — pass through `is_fallback`
5. Update `CityNeighborhoodPriceTable.tsx` — fallback badge + muted styling
6. Update `NeighborhoodDetailDialog.tsx` — fallback info note
7. Update `CitySourceAttribution.tsx` — non-CBS city handling
8. Update `PriceByApartmentSize.tsx` — conditional source badge
9. Delete duplicate Ashkelon mappings from DB

