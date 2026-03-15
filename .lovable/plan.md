

## Plan: Audit Cities Table & Replace Hardcoded National Average

### 1. Update cities table with CBS data

Comparing `city_summary.csv` against the current `cities` table reveals significant mismatches across nearly every city. Here are some of the largest discrepancies:

```text
City            | DB avg/sqm | CBS avg/sqm | DB YoY  | CBS YoY  | DB yield | CBS yield
----------------|------------|-------------|---------|----------|----------|----------
Ashkelon        | 15,420     | 17,186      | -8.4%   | +11.18%  | 3.0%     | 2.83%
Beer Sheva      | 11,470     | 15,150      | +2.4%   | +4.23%   | 7.5%     | 3.05%
Beit Shemesh    | 23,000     | 26,050      | +9.7%   | -0.25%   | 5.04%    | 2.70%
Caesarea        | 40,900     | 21,627      | +13.7%  | (none)   | 1.8%     | 2.59%
Eilat           | 17,200     | 19,012      | +1.8%   | -5.64%   | 8.0%     | 3.35%
Givat Shmuel    | 27,800     | 28,150      | -2.1%   | -7.21%   | 3.0%     | 2.73%
Hadera          | 20,500     | 21,508      | -6.8%   | +7.86%   | 3.5%     | 2.59%
Ma'ale Adumim   | 21,918     | 17,971      | +13.9%  | +2.16%   | 3.35%    | 2.73%
Ramat Gan       | 35,000     | 44,956      | -5.7%   | +2.12%   | 2.77%    | 2.63%
Tel Aviv        | 68,297     | 53,468      | -7.6%   | -1.03%   | 3.0%     | 2.71%
Zichron Yaakov  | 27,400     | 19,741      | +13.5%  | -8.6%    | 2.5%     | 2.93%
(and more...)
```

**Action:** Run UPDATE statements for all 24 cities with CBS data to set `average_price_sqm`, `yoy_price_change`, and `gross_yield_percent` to the CBS values. Also update `median_apartment_price` using the `latest_avg_all` column from CBS (which represents the average transaction price across all room types — closest proxy to median).

### 2. Replace hardcoded NATIONAL_AVG_PRICE_SQM

There are **3 places** where the national average is defined:
- `src/lib/constants/marketAverages.ts` — `32,000` (the canonical constant)
- `src/components/city/CityMarketSnapshot.tsx` — hardcoded `22,800` (stale duplicate!)
- `src/components/city/MarketRealityTabs.tsx` — hardcoded `32,000` (duplicate)

**Action:**
1. Compute the CBS national average from the data: weighted average of all `avg_price_per_sqm` values ≈ **₪27,700/sqm**
2. Update `marketAverages.ts` to this CBS-derived value
3. Remove the local hardcoded constants in `CityMarketSnapshot.tsx` and `MarketRealityTabs.tsx` — replace with the import from `marketAverages.ts`

### Summary of changes

| What | Action |
|------|--------|
| 24 city rows in `cities` table | UPDATE `average_price_sqm`, `yoy_price_change`, `gross_yield_percent`, `median_apartment_price` |
| `marketAverages.ts` | Change `NATIONAL_AVG_PRICE_SQM` from 32000 to ~27700 |
| `CityMarketSnapshot.tsx` | Remove local `NATIONAL_AVG_PRICE_SQM = 22800`, import from constants |
| `MarketRealityTabs.tsx` | Remove local `NATIONAL_AVG_PRICE_SQM = 32000`, import from constants |

No schema changes needed — all updates are to existing columns and existing code files.

