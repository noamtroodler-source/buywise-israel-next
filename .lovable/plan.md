

# Neighborhood Audit Fix Phases

Based on the Perplexity audit of 262 neighborhood mappings, 10 extreme YoY values, price tiers, Anglo tags, and data pipeline integrity. Organized by severity.

---

## Phase N1: Critical — Data Sourcing Disclosure & German Colony Fix

**The #1 issue: the platform says "CBS" for neighborhood-level data, but CBS does NOT publish at this level.** All neighborhood prices come from Madlan/CARMEN transaction aggregation via ArcGIS statistical area IDs, not official CBS codes.

### 1A. Fix all "CBS" labels on neighborhood-level data

Every place that says "CBS" next to neighborhood prices must be changed to "Market transaction data" or similar:

| File | Current text | Fix |
|------|-------------|-----|
| `NeighborhoodDetailDialog.tsx` line 128 | "CBS (Central Bureau of Statistics) · 4-room avg" | "Market transaction data · 4-room avg" |
| `CityNeighborhoodPriceTable.tsx` line 211 | "Source: CBS...4-room apartment averages" | "Source: Market transaction data · 4-room apartment averages" |
| `CityNeighborhoodPriceTable.tsx` line 260 | "based on recent CBS transactions" | "based on recent market transactions" |
| `PriceByApartmentSize.tsx` — InlineSourceBadge | Shows "CBS" badge | Conditional: show CBS badge only for city-level data in CBS-covered cities, show "Market Data" for neighborhood-level |
| `CitySourceAttribution.tsx` lines 195-196 | Claims CBS for neighborhood prices | Clarify: CBS provides city-level data; neighborhood-level comes from aggregated transaction records (Madlan) |

### 1B. Rename "cbs_neighborhood_id" internally

The 8-digit IDs are NOT CBS codes. Rename references in comments and admin UI only (DB column rename is optional/risky):
- `MapNeighborhoods.tsx` line 381 — change column header from showing "CBS ID" to "Zone ID"
- Update all code comments that say "CBS IDs" to "statistical area IDs (ArcGIS/Madlan)"

### 1C. Fix German Colony -49% — Add sample size safeguards

In the price calculation hooks, suppress extreme YoY values when sample size is likely too small:
- `useNeighborhoodPrices.ts` and `useNeighborhoodPriceTable.ts` — if `|yoy_change_percent| > 25%`, cap display or add warning flag
- Add a `yoy_warning` boolean field to the return data when extreme values detected
- UI components (`CityNeighborhoodHighlights.tsx`, `CityNeighborhoodPriceTable.tsx`) — show "⚠ Low volume" tooltip when warning is true

---

## Phase N2: High Priority — Fallback Data Labels & Non-CBS City Disclosure

### 2A. Label city-average fallback data

100+ neighborhoods show identical city-average prices. When multiple neighborhoods in the same city return the exact same price, they're using fallback data.

- In `useNeighborhoodPriceTable.ts` — after building rows, detect groups of 3+ neighborhoods with identical `avg_price`. Flag them with `is_fallback: true`
- In `CityNeighborhoodPriceTable.tsx` — show "(City avg)" badge on fallback rows, mute styling
- In `NeighborhoodDetailDialog.tsx` — if fallback, show "City-average price shown — neighborhood-specific data unavailable"

### 2B. Clarify non-CBS cities

9 cities have no CBS coverage at all. For these cities, source attribution must never mention CBS:
- Create a constant: `NON_CBS_CITIES = ['Eilat', 'Givat Shmuel', 'Hod HaSharon', 'Pardes Hanna', 'Zichron Yaakov', "Ma'ale Adumim", 'Efrat', 'Caesarea', "Ra'anana"]`
- In `CitySourceAttribution.tsx` — when `cityName` is in this list, show "All market data from aggregated transaction records" instead of mentioning CBS
- In `PriceByApartmentSize.tsx` — hide CBS badge for non-CBS cities

### 2C. Remove duplicate CBS mappings (database)

The audit found duplicates in Ashkelon: "Barnea" and "Barnea (ברניע)" map to same zones, same for City Center and Marina. Clean these from the `neighborhood_cbs_mappings` table.

---

## Phase N3: Medium Priority — Price Tier Corrections & Anglo Tags

### 3A. Fix 3 incorrect price tier classifications (database)

Update `featured_neighborhoods` JSONB in the `cities` table:

| City | Neighborhood | Current | Correct |
|------|-------------|---------|---------|
| Tel Aviv | Florentin | budget | mid-range |
| Jerusalem | Katamon | mid-range | premium |
| Jerusalem | German Colony/Baka | premium | ultra-premium |

### 3B. Add 7 missing Anglo neighborhoods

Update `angloNeighborhoodTags.ts`:
- Jerusalem: add `'French Hill'`, `'Talpiot'`, `'Armon HaNatziv'`
- Beit Shemesh: add `'RBS Bet'`, `'RBS Hey'`, `'Neve Shamir'`
- Gush Etzion: add `'Ma'ale Amos'`, `'Meitzad'`

### 3C. Review 2 flagged Anglo tags

- `Katamonim` — keep but consider adding "(emerging)" qualifier in tooltip
- `Kikar HaSharon` — verify if this is a real residential neighborhood; remove if not

---

## Phase N4: Low Priority — Room Count Disclaimer & Data Quality Labels

### 4A. Room-count data disclaimer

CBS does NOT publish room-count prices at neighborhood level. `PriceByApartmentSize.tsx` should clarify that room-specific breakdowns use transaction aggregation data, not CBS statistics.

### 4B. Data quality percentage display (admin only)

Add a column to the admin neighborhood mapping dashboard showing "% Real Data" per city (from the audit table), so admins know which cities have meaningful coverage vs. fallback-heavy data.

---

## Execution Order

1. **Phase N1** — Fix CBS sourcing claims, rename IDs, add YoY safeguards (highest legal/credibility risk)
2. **Phase N2** — Label fallback data, clarify non-CBS cities, clean duplicates
3. **Phase N3** — Fix price tiers, add missing Anglo tags
4. **Phase N4** — Room-count disclaimer, admin data quality indicators

