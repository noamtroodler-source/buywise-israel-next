

## Price by Apartment Size — Standalone Chart Section

### What we're building

A new `PriceByApartmentSize` component placed on every city/area page between the Price History section and the Worth Watching section. It shows quarterly price trends for 3-room, 4-room, and 5-room apartments using data already in the `city_price_history` table (rooms = 3, 4, 5).

### Data availability

- 22-23 cities have room-specific data (2020–2025, quarterly)
- Cities without data: the section simply won't render (same pattern as Worth Watching)

### Design

**Layout** — Matches the existing `HistoricalPriceChart` visual language:
- Same `py-16 bg-background` section (alternating with the `bg-muted/40` Price History above it)
- Same motion.div fade-in animation
- Same header pattern: title left, controls right

**Content structure:**
1. **Header**: "Price by Apartment Size" + subtitle "Average transaction prices by room count in {cityName}"
2. **Current price summary cards** (3 inline pills/cards): Latest available price for each room type (3-room, 4-room, 5-room) with YoY change badge — gives immediate actionable numbers without needing to read the chart
3. **Line chart**: 3 colored lines (one per room type) on a quarterly x-axis. Colors: Primary blue for 3-room, teal (#1FA3A3) for 4-room, a muted amber for 5-room — distinct and accessible
4. **Interactive tooltip**: Shows all 3 room prices for the hovered quarter, plus YoY change per type
5. **Inline legend** + `InlineSourceBadge` with CBS attribution (same as Price History)

**Room type toggle**: Not needed — showing all 3 lines simultaneously is more useful for comparison. With only 3 lines the chart stays clean.

### Technical approach

**New hook**: `useRoomPriceHistory(citySlug)` in `src/hooks/useRoomPriceHistory.ts`
- Queries `city_price_history` where `rooms IN (3, 4, 5)`
- Resolves city name from slug via cities table (same pattern as `useHistoricalPrices`)
- Returns data grouped by quarter with all room types merged per data point: `{ year, quarter, label: "Q1 2024", room3: number, room4: number, room5: number }`

**New component**: `src/components/city/PriceByApartmentSize.tsx`
- Accepts `citySlug`, `cityName`, `dataSources`, `lastVerified`
- Returns `null` if no room-specific data exists (graceful fallback)
- Uses Recharts `LineChart` with `ResponsiveContainer` (same as HistoricalPriceChart)
- Summary cards computed from the latest data point + YoY from same quarter previous year

**Integration in `AreaDetail.tsx`**:
- Import and place between the Price History section (`id="price-history"`) and Worth Watching section (`id="watching"`)
- Pass `citySlug`, `cityName`, `dataSources`, `lastVerified`

### Files to create/modify

| File | Action |
|------|--------|
| `src/hooks/useRoomPriceHistory.ts` | Create — new hook for room-specific quarterly data |
| `src/components/city/PriceByApartmentSize.tsx` | Create — new chart component |
| `src/pages/AreaDetail.tsx` | Modify — import and render new section |

