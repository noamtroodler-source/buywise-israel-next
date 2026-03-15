

# Plan: Drop 5 Duplicate Tables and Migrate Code References

## Summary

Drop `city_canonical_metrics`, `report_versions`, `historical_prices`, `market_data`, `rental_prices`, and `renovation_costs` (6 tables total). Refactor ~10 files to read from the correct surviving tables: `cities` and `city_price_history`.

---

## Tables Being Dropped

| Table | Rows | Replaced By |
|-------|------|-------------|
| `renovation_costs` | 27 | `cities` table fields |
| `rental_prices` | 149 | `cities` table rental fields |
| `city_canonical_metrics` | 25 | `cities` table (identical fields) |
| `report_versions` | 1 | No longer needed (FK for canonical) |
| `historical_prices` | 718 | `city_price_history` (1,625 rows, quarterly, by room count) |
| `market_data` | 109 | `city_price_history` |

---

## Code Changes (by file)

### 1. Delete hook files (no longer needed)
- **`src/hooks/useCanonicalMetrics.tsx`** — Delete entirely. Components that import `CanonicalMetrics` type or `getRentalRange` will use `cities` data directly instead.
- **`src/hooks/useRentalPrices.tsx`** — Delete. Not imported anywhere except itself.
- **`src/hooks/useMarketData.tsx`** — Delete. Replace usages with `city_price_history` queries.

### 2. Rewrite `src/hooks/useHistoricalPrices.tsx`
- Query `city_price_history` instead of `historical_prices`
- Map: `rooms=0` (all rooms), `avg_price_nis` → `average_price`, compute yearly averages from quarterly data
- Keep the same exported interface shape so consumers don't break

### 3. Rewrite `src/hooks/useNationalAveragePrices.ts`
- Query `city_price_history` where `rooms=0`, group by year, average across cities
- Same output interface

### 4. Update `src/pages/AreaDetail.tsx`
- Remove `useMarketData` and `useCanonicalMetrics` imports
- Remove `marketData` and `canonicalMetrics` variables
- Pass `cityData` (from `cities` table via `useCityDetails`) directly to child components instead of canonical metrics
- Update props passed to `CityQuickStats`, `CityMarketSnapshot`, `MarketOverviewCards`
- For `lastVerified`, use `city.updated_at` instead of `canonicalMetrics?.updated_at`

### 5. Update `src/components/city/CityQuickStats.tsx`
- Remove `CanonicalMetrics` import and `canonicalMetrics` prop
- Remove `MarketData` import and `marketData` prop  
- Simplify: read everything from `cityData` prop (which comes from `cities` table)
- Rental range logic: use `cityData.rental_X_room_min/max` directly

### 6. Update `src/components/city/CityMarketSnapshot.tsx`
- Same as CityQuickStats — remove canonical/marketData props, use cityData only

### 7. Update `src/components/city/PriceTrendChart.tsx`
- Currently uses `useCityComparison` from `useMarketData` (queries `market_data` table)
- Rewrite to query `city_price_history` with `rooms=0` for price/sqm trend data
- Compute price_per_sqm from `avg_price_nis` and typical apartment sizes, or use `country_avg` for national comparison
- Note: `city_price_history` has `avg_price_nis` (total price) not price/sqm. The chart currently shows price/sqm from `market_data`. We'll compute approximate price/sqm or switch the chart to show average transaction price (which is what CBS data actually represents).

### 8. Update `src/pages/Compare.tsx`
- Remove queries to `rental_prices` and `market_data` tables
- For rental estimates: query `cities` table rental fields instead
- For price/sqm comparison: already queries `cities` table — just remove the unused `market_data` fetch

### 9. Update `src/components/tools/TrueCostCalculator.tsx` and `RentVsBuyCalculator.tsx`
- Replace `useCanonicalMetrics(city)` with `useCityDetails(city)` 
- Access same fields (average_price_sqm, rental data, arnona) from `cityDetails` instead

### 10. Update `src/pages/admin/AdminAccuracyAudit.tsx`
- Remove canonical metrics comparison (the whole point was comparing canonical vs cities — no longer needed)
- Simplify to just show cities table data, or remove page entirely

### 11. Update `src/pages/admin/AdminMarketDataPage.tsx`
- Repoint from `historical_prices` to `city_price_history` for CRUD operations
- Update the interface and form fields to match `city_price_history` schema

### 12. Minor updates
- `src/components/property/PropertyInvestmentScore.tsx` — uses `useHistoricalPrices` which will be rewritten (no change needed in this file if interface stays the same)
- `src/lib/utils/sourceFormatting.ts` — remove `historical_prices` key from source labels

---

## Database Migration

Single migration to drop all 6 tables + their associated triggers/functions:

```sql
DROP TABLE IF EXISTS public.renovation_costs CASCADE;
DROP TABLE IF EXISTS public.rental_prices CASCADE;
DROP TABLE IF EXISTS public.city_canonical_metrics CASCADE;
DROP TABLE IF EXISTS public.report_versions CASCADE;
DROP TABLE IF EXISTS public.historical_prices CASCADE;
DROP TABLE IF EXISTS public.market_data CASCADE;
```

Also remove the `log_property_price_change` function's reference to `listing_price_history` if that table was already dropped (separate concern).

---

## Risk Mitigation

- The `HistoricalPriceChart` component currently shows yearly city prices + national average. `city_price_history` has quarterly data with `avg_price_nis` per room count. We'll use `rooms=0` (all rooms) and average quarters into yearly values to maintain the same chart shape.
- `PriceTrendChart` currently shows monthly price/sqm from `market_data`. Since `city_price_history` only has total price (not per sqm), this chart will switch to showing average transaction price trends instead. This is actually more accurate to what CBS reports.
- Compare page rental estimates will become simpler (direct lookup from `cities` table by city name) rather than a separate table query by room count.

