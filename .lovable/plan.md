

## Plan: Switch to 3-Year Growth & Subtly Communicate the Timeframe

### What changes

**1. Data hooks — change YoY to 3-year comparison**

Both `useNeighborhoodPrices.ts` and `useNeighborhoodPriceTable.ts` currently compare `latestYear` vs `latestYear - 1`. Change these to compare against `latestYear - 3` (same quarter) instead.

**2. UI labels — subtle "3Y" indicator**

In the `TrendIndicator` component (used in both `CityNeighborhoods.tsx` and `CityNeighborhoodHighlights.tsx`), append a small "3Y" suffix to the percentage:

- `+12.5% 3Y` (green, trending up)  
- `-4.3% 3Y` (red, trending down)  
- `Stable 3Y` (neutral)

This is subtle — the number does the talking, and "3Y" just clarifies the window without being wordy. No tooltip or extra UI needed.

**3. Source footnote update**

The footer text in `CityNeighborhoods.tsx` currently says "Prices: CBS · 4-room apartment averages". Update to: "Prices: CBS · 4-room avg · 3-year trend"

### Files to edit

- `src/hooks/useNeighborhoodPrices.ts` — line ~106: change `latestYear - 1` → `latestYear - 3`
- `src/hooks/useNeighborhoodPriceTable.ts` — lines ~96, ~107: change `latest.year - 1` → `latest.year - 3`
- `src/components/city/CityNeighborhoods.tsx` — TrendIndicator: add "3Y" label; update footer text
- `src/components/city/CityNeighborhoodHighlights.tsx` — TrendIndicator: add "3Y" label
- `src/types/neighborhood.ts` — rename `yoy_change_percent` to keep or add comment (field name stays for backward compat, just represents 3Y now)

