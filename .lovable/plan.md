

## City Comparison on Both Charts

### Summary
Add city-vs-city comparison (up to 2 additional cities) to both the **Price History** and **Price by Apartment Size** charts using the existing `CityComparisonSelector` component and existing data hooks.

### Color System (consistent across both)
| Slot | Color | Usage |
|------|-------|-------|
| Current city | `hsl(var(--primary))` | Always slot 0 |
| Compare city 1 | `#1FA3A3` (Teal) | Slot 1 |
| Compare city 2 | `#6366F1` (Indigo) | Slot 2 |

### 1. Price History Chart (`HistoricalPriceChart.tsx`)

**Changes:**
- Add `compareCities` local state (array of city names)
- Import `useCities` to feed city list to selector
- Import and render `CityComparisonSelector` in the header row (between subtitle and period tabs)
- Use `useHistoricalPriceComparison` (already exists) to fetch comparison data
- Merge comparison city data into chart — add one `Line` per comparison city with teal/indigo colors
- Update tooltip to show all city prices for the hovered year
- Update inline legend to show comparison city names
- Keep metrics/insight for current city only (no clutter)

**Data flow:** `useHistoricalPriceComparison(compareCityNames)` → group by year → merge into `filteredData` as `compare1` and `compare2` keys.

### 2. Price by Apartment Size Chart (`PriceByApartmentSize.tsx`)

**Changes:**
- Add `compareCities` local state + `selectedRoom` state (default: null, set to 3 when comparison starts)
- Import `useCities` and `CityComparisonSelector`
- Render selector in header row
- **When no comparison:** Show all 3 room lines for current city (current behavior)
- **When comparing:** Show room type pill toggle (`3-Room | 4-Room | 5-Room`), chart shows selected room type across all cities (max 3 lines)
- Extend `useRoomPriceHistory` to accept an array of city slugs, or create a new `useRoomPriceComparison` hook that fetches room-specific data for multiple cities
- Update summary cards: show selected room price per city (side by side)
- Update tooltip and legend for comparison mode

**New hook:** `useRoomPriceComparison(citySlugs: string[], roomType: number)` — queries `city_price_history` for specific room type across multiple cities, returns data grouped by quarter with one key per city.

### 3. Shared Infrastructure

- `CityComparisonSelector` already exists — no changes needed
- `useCities` already exists — provides city list for the selector
- Need to map city names to slugs for data fetching (cities table lookup)

### Files to modify/create

| File | Action |
|------|--------|
| `src/components/city/HistoricalPriceChart.tsx` | Add comparison state, selector, extra lines |
| `src/components/city/PriceByApartmentSize.tsx` | Add comparison state, room toggle, multi-city lines |
| `src/hooks/useRoomPriceHistory.ts` | Add `useRoomPriceComparison` hook |

