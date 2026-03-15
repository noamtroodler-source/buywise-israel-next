

## Plan: Replace Market Reality with Historical Price Chart Section

### What's changing
- **Delete** `CityMarketReality.tsx` (currently orphaned — not imported anywhere)
- **Create** new `HistoricalPriceChart.tsx` standalone section
- **Add** it to `AreaDetail.tsx` between "Price Trends" (section 5) and "Worth Watching" (section 6)

### New component: `HistoricalPriceChart`

**Data source:** `historical_prices` table via existing `useHistoricalPrices` hook. 34 cities, 2000–2025, yearly `average_price` + `yoy_change_percent` + rich `notes`.

**National average:** New query averaging all cities' `average_price` per year (computed in the component or a small helper query).

**Layout (matches existing page patterns — `PriceTrendsSection` style):**

```text
┌─────────────────────────────────────────────────────┐
│  Price History                     [5Y] [10Y] [All] │
│  How {cityName} prices have moved over time         │
├─────────────────────────────────────────────────────┤
│  +142% total  ·  6.8% CAGR  ·  +8.2% last year    │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────┐    │
│  │  Line chart                                  │    │
│  │  — City (solid primary)                      │    │
│  │  — National avg (dashed muted)               │    │
│  └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│  💡 What this means: Tel Aviv prices are 28%        │
│  above the national average. Over the past 10       │
│  years, the city has grown 6.8% annually...         │
├─────────────────────────────────────────────────────┤
│  [Source badge] · Yearly Data · 2000–2025           │
└─────────────────────────────────────────────────────┘
```

**Features:**
- Period tabs: **5Y / 10Y / All Time** (auto-adjust based on available data)
- Two lines: city price (solid `hsl(var(--primary))`) + national average (dashed `hsl(var(--muted-foreground))`)
- Tooltip showing city price, national avg, YoY change, and the historical `notes` snippet
- Key metrics row: total appreciation, CAGR, latest YoY — all calculated from selected period
- Insight paragraph (auto-generated, contextual)
- Source attribution using `InlineSourceBadge`
- `py-16 bg-muted/40` section background matching `PriceTrendsSection`
- `motion` fade-in animation matching existing sections
- Returns `null` if no data (graceful empty state)

**Price format:** `₪` with abbreviated values (₪1.66M, ₪3.68M) using `useFormatPrice`

### Files touched
1. **Create** `src/components/city/HistoricalPriceChart.tsx`
2. **Edit** `src/pages/AreaDetail.tsx` — add import + render between sections 5 and 6, pass `citySlug`
3. **Delete** `src/components/city/CityMarketReality.tsx`
4. Also clean up other orphaned files: `CityNumbersNarrative.tsx`, `CityAppreciationExplorer.tsx`, `MarketStatsCards.tsx` (all unused)

