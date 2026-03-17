

## Neighborhood Price Table for City Market Pages

### What We're Building
A sortable, responsive table showing **all** neighborhoods with approved CBS price data — not just the 4 featured ones. This significantly expands the data surface (e.g., Jerusalem: 4 featured → ~40+ with price data).

### Data Source & Logic

**Current state:** `useNeighborhoodPrices` fetches approved CBS mappings and returns `Record<string, { avg_price, yoy_change_percent, latest_year, latest_quarter }>` keyed by `anglo_name`. It only covers mapped neighborhoods with price data.

**Gap:** The hook works, but the current `useCityNeighborhoods` only returns the 4 curated featured neighborhoods. The table needs ALL mapped neighborhoods — many of which won't have a `price_tier` or `vibe` since they aren't in the curated roster.

**Solution:** Create a new hook `useNeighborhoodPriceTable` that:
1. Fetches all approved mappings for the city (already have this query pattern)
2. Joins with price data (same as existing hook)
3. Cross-references with the featured_neighborhoods array to pull `price_tier` and `vibe` where available
4. Returns a flat array sorted by price (descending) by default

This avoids duplicating logic while giving the table complete data.

### Sorting Logic
- Default sort: Avg Price descending (highest first — buyers care about where the money goes)
- Sortable columns: Neighborhood name (A-Z), Avg Price, YoY Change
- Price Tier is **not sortable** — it's only present for featured neighborhoods; sorting would be misleading with sparse data
- Sort direction toggles on click (asc ↔ desc), with a visual indicator arrow

### Edge Cases & Holes to Address

| Issue | Solution |
|---|---|
| Neighborhoods with no price data (CBS gap) | Don't show them in the table — table is specifically a price table |
| Neighborhoods with price but no YoY (only 1 year of data) | Show price, show "—" for YoY column |
| Duplicate anglo_names mapping to multiple CBS zones | The existing hook already handles this (takes first match). We should average across zones for the same anglo_name |
| Price tier only exists for 4 featured neighborhoods | Show badge when available, leave cell empty when not — don't fabricate tiers |
| Cities with 0 approved mappings | Don't render the section at all (same pattern as existing neighborhood highlights) |
| Cities with very few (1-3) mappings | Still show the table — even 2-3 rows is useful context |
| Mobile responsiveness | Horizontal scroll on the table with sticky first column (neighborhood name) |

### UI Design (Brand-Compliant)

**Section placement:** Below the existing Neighborhood Highlights cards, above the Market Overview section. The cards give the curated "vibe" story; the table gives the complete data picture.

**Section container:** Matches existing pattern — `py-10 bg-background` (alternating with `bg-muted/30` of the highlights section above).

**Header:** `BarChart3` icon + "Neighborhood Prices in {cityName}" + InlineSourceBadge (CBS attribution) + subtitle: "Average 4-room apartment prices based on recent transactions"

**Table styling:**
- Uses existing shadcn `Table` components
- Header row: `text-muted-foreground`, subtle bottom border
- Sortable headers get a clickable style with `ArrowUpDown` icon (muted until active, then `ArrowUp`/`ArrowDown` in primary blue)
- Row hover: `hover:bg-muted/50` (already default in Table component)
- Featured neighborhoods get a subtle `MapPin` icon next to name to indicate they're in the curated highlights

**Column layout:**
| Neighborhood | Avg Price (4-room) | YoY Change | Price Tier |
|---|---|---|---|
| German Colony 📍 | ₪2.8M | +4.2% ↑ | Ultra-premium |
| Baka 📍 | ₪2.4M | +2.1% ↑ | Premium |
| French Hill | ₪1.9M | -1.3% ↓ | — |

- Price: formatted with `formatCompactPrice` (reuse from highlights)
- YoY: colored trend indicator (reuse `TrendIndicator` pattern from highlights — green/red/neutral)
- Price Tier: Badge with uniform blue styling (reuse `priceTierConfig` from highlights)

**"Showing X of Y neighborhoods" footer** when data is partial.

### Files to Create/Edit

1. **`src/hooks/useNeighborhoodPriceTable.ts`** — New hook that combines CBS mappings + featured neighborhood metadata into a flat sortable array
2. **`src/components/city/CityNeighborhoodPriceTable.tsx`** — New component: sortable table with the design above
3. **`src/pages/AreaDetail.tsx`** — Add the new section between Neighborhood Highlights and Market Overview

### Mobile Behavior
- Table scrolls horizontally inside the existing `Table` wrapper (already has `overflow-auto`)
- Neighborhood name column gets `sticky left-0 bg-background` so it stays visible during scroll
- Font sizes step down slightly on mobile (`text-sm` → `text-xs` for price/YoY cells)

