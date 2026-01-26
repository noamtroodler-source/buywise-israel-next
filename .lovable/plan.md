

# City Data Synchronization: Single Source of Truth from Area Pages

## Summary

This plan ensures **all city data across the entire site** is strictly synchronized with the data displayed on the Area/City pages (e.g., `/areas/tel-aviv`, `/areas/raanana`). The Area pages display data from the **`cities` table**, which becomes the **Single Source of Truth** for all other features.

---

## Understanding the Current Data Flow

The Area pages (`/areas/:slug`) get their data from:

| Source | Hook | Used For |
|--------|------|----------|
| **`cities` table** | `useCity(slug)` | Primary city data (prices, rentals, yields, arnona, lifestyle) |
| **`city_canonical_metrics` table** | `useCanonicalMetrics(slug)` | Versioned data overlay (takes priority when present) |
| **`market_data` table** | `useMarketData(city)` | Historical price trends |

The `cities` table is what powers the Area pages. Everything else in the site should use this same data.

---

## Current Problem: Multiple Conflicting Sources

Right now, data comes from **different places** across the site:

| Location | Current Data Source | Issue |
|----------|---------------------|-------|
| Area Pages | `cities` table + `city_canonical_metrics` | Canonical sometimes differs from cities |
| Compare Page | `cities` table directly | Works correctly |
| PropertyCostBreakdown | `useCityDetails` → `cities` table | Works correctly |
| PropertyInvestmentScore | `useCityDetails` → `cities` table | Works correctly |
| InvestmentROICalculator | `useCities` → `cities` table | Works correctly |
| NeighborhoodMatch | `useCities` → `cities` table | Works correctly |
| RegionExplorer | **Hardcoded** property counts | Needs fix |
| CityQuickStats | **Hardcoded** `NATIONAL_AVG_PRICE_SQM = 22800` | Needs review |
| MarketOverviewCards | **Hardcoded** `NATIONAL_AVG_PRICE_SQM = 32000` | **Different value!** |
| AreaDetail.tsx | **Hardcoded** fallback identity sentences | Can be removed |

---

## What Needs to Be Fixed

### Issue 1: Canonical Metrics vs Cities Table Discrepancies

The `city_canonical_metrics` table has **different values** than the `cities` table for many cities:

| City | Cities Table Price/sqm | Canonical Price/sqm | Difference |
|------|------------------------|---------------------|------------|
| Ashkelon | ₪15,420 | ₪19,000 | +23% |
| Beer Sheva | ₪11,470 | ₪14,500 | +26% |
| Beit Shemesh | ₪23,000 | ₪19,000 | -17% |
| Efrat | ₪26,750 | ₪16,000 | -40% |
| Tel Aviv | ₪57,000 | ₪65,000 | +14% |

**The Area pages show a mix** of both (canonical takes priority), creating inconsistency.

**Solution**: The `city_canonical_metrics` table should be synchronized FROM the `cities` table values, making `cities` the true single source.

### Issue 2: Different National Average Constants

| File | Constant | Value |
|------|----------|-------|
| `CityQuickStats.tsx` | `NATIONAL_AVG_PRICE_SQM` | ₪22,800 |
| `MarketOverviewCards.tsx` | `NATIONAL_AVG_PRICE_SQM` | ₪32,000 |

**These show different "vs national avg" percentages on the same page!**

**Solution**: Unify to a single constant or database-driven value.

### Issue 3: Hardcoded RegionExplorer Property Counts

The home page shows hardcoded property counts (e.g., "Tel Aviv: 150 properties") that are not connected to actual data.

**Solution**: Either remove counts or fetch dynamically from properties table.

### Issue 4: Fallback Identity Sentences

`AreaDetail.tsx` has 27 hardcoded fallback identity sentences. Since all cities now have `identity_sentence` in the database, these are redundant.

**Solution**: Remove hardcoded fallbacks, keep only a generic fallback.

---

## Implementation Plan

### Phase 1: Database Synchronization

**Sync `city_canonical_metrics` to match `cities` table values**

Run SQL to update the canonical metrics table for the active report version so it matches what's in the cities table:

```sql
UPDATE city_canonical_metrics cm
SET
  average_price_sqm = c.average_price_sqm,
  median_apartment_price = c.median_apartment_price,
  yoy_price_change = c.yoy_price_change,
  gross_yield_percent = c.gross_yield_percent,
  net_yield_percent = c.net_yield_percent,
  arnona_rate_sqm = c.arnona_rate_sqm,
  arnona_monthly_avg = c.arnona_monthly_avg,
  rental_3_room_min = c.rental_3_room_min,
  rental_3_room_max = c.rental_3_room_max,
  rental_4_room_min = c.rental_4_room_min,
  rental_4_room_max = c.rental_4_room_max,
  updated_at = now()
FROM cities c
WHERE cm.city_slug = c.slug
  AND cm.report_version_key = (SELECT version_key FROM report_versions WHERE is_active = true);
```

---

### Phase 2: Code Cleanup

#### 2.1 Remove Hardcoded Fallback Identity Sentences

**File**: `src/pages/AreaDetail.tsx`

Remove lines 29-58 (the `fallbackIdentities` object) and simplify the logic:

```tsx
// Before: 30 lines of hardcoded fallbacks

// After: Simple fallback chain
const identitySentence = city.identity_sentence 
  || city.description 
  || `${city.name} is a city in Israel with its own unique character and real estate market.`;
```

#### 2.2 Unify National Average Constants

**Files**:
- `src/components/city/CityQuickStats.tsx`
- `src/components/city/MarketOverviewCards.tsx`

Create a shared constants file and use a single value:

```tsx
// src/lib/constants/marketAverages.ts
export const NATIONAL_AVG_PRICE_SQM = 32000; // 2025 nationwide average
export const NATIONAL_AVG_ARNONA = 55; // Per sqm annual
```

Update both components to import from this file.

#### 2.3 Update RegionExplorer Property Counts

**File**: `src/components/home/RegionExplorer.tsx`

**Option A** (Simpler - Remove counts): Remove the `propertyCount` field entirely and the display:

```tsx
// Before
<p className="text-sm text-white/80">{city.propertyCount} properties</p>

// After
<p className="text-sm text-white/80">Explore properties</p>
```

**Option B** (Dynamic - Fetch counts): Create a hook that counts properties per city. More complex but accurate.

---

### Phase 3: Files to Modify

| File | Change |
|------|--------|
| `src/pages/AreaDetail.tsx` | Remove hardcoded `fallbackIdentities` (lines 29-58), simplify identity sentence logic |
| `src/components/city/CityQuickStats.tsx` | Import `NATIONAL_AVG_PRICE_SQM` from shared constants |
| `src/components/city/MarketOverviewCards.tsx` | Import `NATIONAL_AVG_PRICE_SQM` and `NATIONAL_AVG_ARNONA` from shared constants |
| `src/components/home/RegionExplorer.tsx` | Remove or dynamize hardcoded property counts |
| `src/lib/constants/marketAverages.ts` | **New file** - Centralized market constants |

---

### Phase 4: Database Updates

| Table | Operation | Description |
|-------|-----------|-------------|
| `city_canonical_metrics` | UPDATE | Sync all values to match `cities` table |

---

## Data Flow After Implementation

```text
                     cities table
                    (Single Source)
                          |
         +----------------+----------------+
         |                |                |
    Area Pages      All Components    Canonical Metrics
   (AreaDetail)    (PropertyCost,     (Auto-synced
                   Compare, Tools)    from cities)
```

All data flows FROM the `cities` table. The canonical metrics become a synchronized copy for versioning purposes, not an independent source.

---

## Verification Checklist

After implementation:

- [ ] Area page Quick Stats match cities table data
- [ ] Area page Market Overview shows same national avg comparison as Quick Stats
- [ ] Compare page shows correct "Price vs City Avg" using cities table
- [ ] PropertyCostBreakdown shows correct arnona from cities table
- [ ] InvestmentROICalculator shows correct yields from cities table
- [ ] NeighborhoodMatch uses correct city investment scores
- [ ] RegionExplorer no longer shows outdated property counts
- [ ] No hardcoded city-specific data remains in code

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss during sync | Only updating canonical_metrics FROM cities (cities is source of truth) |
| Breaking calculations | All components already use cities table hooks; this change just ensures consistency |
| UI changes | Changes are invisible to users - same data source, same display |

---

## Summary of Changes

1. **Database**: Sync `city_canonical_metrics` → match `cities` table values
2. **AreaDetail.tsx**: Remove 30 lines of hardcoded fallback sentences
3. **CityQuickStats.tsx**: Use shared constant for national average
4. **MarketOverviewCards.tsx**: Use shared constant for national average
5. **RegionExplorer.tsx**: Remove hardcoded property counts
6. **New file**: `src/lib/constants/marketAverages.ts`

This ensures every part of the site shows **exactly the same data** that appears on the Area pages.

