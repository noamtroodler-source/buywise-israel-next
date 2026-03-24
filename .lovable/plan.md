

# Phase N4: Room Count Disclaimer & Admin Data Quality Indicators

---

## 1. Room-count data disclaimer in PriceByApartmentSize

**`src/components/city/PriceByApartmentSize.tsx`** — Add a small disclaimer below the source attribution (line ~488) noting that room-specific price breakdowns use aggregated transaction data, not official CBS neighborhood statistics:

Add text: `"Room-size breakdowns derived from aggregated transaction records, not official CBS neighborhood statistics."`

This goes inside the existing source attribution area as an additional `text-xs text-muted-foreground` line.

## 2. Admin data quality indicator per city

**`src/pages/admin/MapNeighborhoods.tsx`** — Add a summary card/section above the mappings table showing per-city "% Real Data" coverage:

- After loading `dbMappings`, group by city and calculate:
  - Total neighborhoods per city
  - Neighborhoods with `status = 'approved'` and valid zone IDs
  - Percentage = approved with data / total
- Display as a small grid of city cards showing `CityName: X% coverage (Y/Z neighborhoods)`
- Color-code: green (>70%), yellow (30-70%), red (<30%)

This gives admins at-a-glance visibility into which cities have meaningful neighborhood-level data vs. fallback-heavy coverage.

---

## Execution Order

1. Add room-count disclaimer to `PriceByApartmentSize.tsx`
2. Add data quality summary section to `MapNeighborhoods.tsx`

