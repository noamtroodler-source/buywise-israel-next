

## Update NATIONAL_AVG_PRICE_SQM to Reflect True National Data

### Problem
`NATIONAL_AVG_PRICE_SQM = 27,700` was derived from an unweighted average of the 25 cities on the platform — heavily skewed by Tel Aviv (₪53k) and Ramat Gan (₪45k). The CBS national average (from `country_avg` in `city_price_history`) is approximately **₪22,685/sqm**, about 18% lower.

This means city pages currently understate how expensive a city is relative to the true national average.

### What Changes

**Single file edit — `src/lib/constants/marketAverages.ts`:**
- Update `NATIONAL_AVG_PRICE_SQM` from `27700` to `22700` (rounded from CBS ₪1,928,200 ÷ 85m² average apartment)
- Update the comment to note the derivation method and CBS source

**No other files change.** All 4 consumer files (`MarketOverviewCards`, `CityQuickStats`, `CityMarketSnapshot`, `MarketRealityTabs`) already import the constant — they'll automatically reflect the corrected benchmark.

### Impact on City Pages
Cities will now show higher "above national" percentages, which is more accurate:

| City | Old "vs national" | New "vs national" |
|------|-------------------|-------------------|
| Tel Aviv | +93% | +135% |
| Beer Sheva | -45% | -33% |
| Modi'in | +8% | +32% |

### Technical Notes
- The `country_avg` column stores total transaction price (not per sqm), so we divide by ~85m² (CBS average apartment size for all-rooms aggregate). This is an approximation but matches CBS methodology.
- The `NATIONAL_AVG_ARNONA = 55` constant is unrelated and stays unchanged.

