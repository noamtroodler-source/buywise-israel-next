

## Communicate Missing Data — Own Pages + Comparison Mode

### What we're doing
Two scenarios need missing-data messaging:

1. **On the city's own page** (Caesarea, Efrat, Gush Etzion) — instead of silently hiding chart sections, show the section header with an `InfoBanner` explaining why data is limited.
2. **When adding a data-sparse city as a comparison** on another city's page — show a small inline notice near the comparison selector or chart indicating that the compared city has limited/no data for this view.

### Changes

**1. `HistoricalPriceChart.tsx`**
- **Own page (no data):** Replace `if (filteredData.length < 2) return null` with rendering the section shell + `InfoBanner`: *"Historical price trend data isn't available for {cityName}. The CBS requires sufficient transaction volume to publish trends."*
- **Comparison mode (no data for compared city):** After merging comparison data, detect if a comparison city has zero data points (all `compare0`/`compare1` values are null). If so, render a small `InfoBanner` below the selector: *"{CityName} doesn't have enough transaction data for historical price trends."*

**2. `PriceByApartmentSize.tsx`**
- **Own page (no data):** Replace `if (latestPrices.length === 0 || displayData.length < 2) return null` with section shell + `InfoBanner`: *"Room-specific price data isn't available for {cityName}. The CBS requires a minimum number of transactions per room type."*
- **Own page (partial data, e.g. Efrat):** Add a subtle note below summary cards listing which room types are available: *"Data available for 5-room apartments only. Other room types have insufficient transaction volume."*
- **Comparison mode (no data for compared city + room type):** Detect if a comparison city slug has zero data points in `compDisplayData`. Show `InfoBanner` below selector: *"{CityName} doesn't have {N}-room transaction data available."*

**3. Both files:** Import `InfoBanner` from `@/components/tools/shared/InfoBanner`.

### Detection logic
- **Own page no data:** `filteredData.length < 2` / `latestPrices.length === 0`
- **Comparison missing data:** After data loads, check if any comparison city slug has zero non-null values across the merged/comparison dataset. Map slug back to city name via `compareCities` state for the message.

