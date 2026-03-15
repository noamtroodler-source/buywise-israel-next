

## Fix Missing Data Communication for Efrat, Caesarea, and Gush Etzion

### Problem
The current implementation shows Efrat's 5-room data as if it's meaningful, but it likely has too few data points to be useful. The user wants all three cities (Efrat, Caesarea, Gush Etzion) treated similarly: show the section shell with the comparison selector, but display an InfoBanner instead of chart content, and communicate missing data when these cities are added as comparisons on other city pages.

### Changes

**1. `PriceByApartmentSize.tsx`**

- For Efrat (partial data): Currently shows a 5-room summary card + chart line + partial data banner. Change to treat it the same as no data — show the section header, comparison selector, and InfoBanner only. No summary cards, no chart.
- Simplify: Remove the `hasPartialData` logic entirely. If `latestPrices.length === 0` or `displayData.length < 2`, treat as `hasNoData`. But also add a stricter check: if available room types cover fewer than 2 of the 3 standard sizes (3, 4, 5), treat as `hasNoData` — the data isn't meaningful enough.
- Actually, simpler approach per user intent: just expand `hasNoData` to also be true when `displayData.length < 2` OR `latestPrices.length === 0`. The current Efrat case (only 5-room) already shows sparse chart. Change: set `hasNoData = true` when there are fewer than 2 room types with data, so Efrat gets the same "no data" treatment.
- When `hasNoData`: show section header + comparison selector + InfoBanner. Hide summary cards, partial data banner, and chart entirely.
- Remove `hasPartialData` logic and its banner.

**2. `HistoricalPriceChart.tsx`**
- No changes needed for own-page — Gush Etzion already shows the no-data banner. Caesarea and Efrat have historical data and display fine.
- Comparison mode banners already work.

**3. Comparison mode (both components)**
- The existing comparison-city-no-data detection already works. For `PriceByApartmentSize`, when a compared city (Efrat/Caesarea/Gush Etzion) has no data for the selected room type, the banner already shows. Verify that the current city slug itself also gets checked — if the current city has no data but a comparison city does, we should still show comparison chart if comparison data exists. Current logic gates the entire chart on `!hasNoData` which would block this. 
- Fix: When `hasNoData` for current city but comparison mode is active and comparison data exists, still show the comparison chart. Adjust the conditional to: hide chart only when `hasNoData && !isComparing`, or when `isComparing && compDisplayData.length < 2`.

### Summary of changes

**`PriceByApartmentSize.tsx`:**
1. Expand `hasNoData` to include cases with only 1 room type (like Efrat's 5-room only)
2. Remove `hasPartialData` logic and its banner
3. When `hasNoData` and not comparing: show InfoBanner, hide cards + chart
4. When `hasNoData` but comparing with cities that have data: show comparison chart + room selector, plus banner noting current city lacks data
5. Comparison cities missing data: existing banner works, no change needed

**`HistoricalPriceChart.tsx`:**
- Already handles all cases correctly. No changes needed.

