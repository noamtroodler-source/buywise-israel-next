

## Plan: Always Show All 3 Value Snapshot Cards (with "No Data" State)

### Problem
When CBS price data is missing for a city/neighborhood (e.g., Efrat, Ashkelon neighborhoods without CBS mappings), the "vs City Avg" and "12-Month Trend" cards are silently hidden. This leaves only 1 or 2 cards, which looks incomplete and gives no explanation.

### Solution
Always render all 3 cards in the purchase view. When data is unavailable, show the card with a muted "No data yet" message instead of hiding it.

### Changes — `PropertyValueSnapshot.tsx`

**Card 1 (This Property — Price/m²):** Already handles missing `sizeSqm` by not rendering. Change: show card with "Size not listed" message when `sizeSqm` is null.

**Card 2 (vs City Avg):** Currently hidden when `purchaseComparisonPercent` is null or `averagePriceSqm` is missing. Change: always show the card. When data is unavailable, display the label "vs {city} Avg" with body text "No data yet" in muted styling and a subtitle like "City average unavailable".

**Card 3 (12-Month Trend):** Currently hidden when `priceChange` is null. Change: always show the card with "No data yet" and subtitle "Trend data unavailable" when missing.

**Grid:** Always use `grid-cols-1 sm:grid-cols-3` for purchase properties (3 cards always present). Remove the dynamic `cardCount` logic.

**Don't render guard:** Remove the `if (!hasPropertyPrice && !hasComparison && !hasTrend) return null` — always render for purchase listings since we always show all 3 cards now.

### Visual style for empty state
- Same card container (`p-4 rounded-xl bg-muted/30 border border-border/50`)
- Icon: use a muted `Minus` icon
- Title: same label (e.g., "vs Efrat Avg")
- Body: "No data yet" in `text-lg font-semibold text-muted-foreground/60`
- Subtitle: brief explanation like "City average unavailable" in `text-xs text-muted-foreground`

