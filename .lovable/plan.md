

## Add Personalized "What This Means" to Price by Apartment Size

### What we're doing
Add a personalized insight box (same InsightCard style) to the PriceByApartmentSize section, with city-specific narratives that interpret the room-size breakdown data for buyers.

### Implementation

**1. New file: `src/components/city/cityRoomSizeInsights.ts`**

Create a parallel insight map (same pattern as `cityInsights.ts`) with:

- `RoomSizeInsightMetrics` interface receiving: `room3Price`, `room4Price`, `room5Price`, `room3YoY`, `room4YoY`, `room5YoY`, `cheapestRoom`, `priciest`, `gapSmallToLarge` (₪ difference between smallest and largest available)
- `CITY_ROOM_SIZE_INSIGHTS` map keyed by slug, ~30 city entries
- `getCityRoomSizeInsight(citySlug, cityName, metrics)` function with fallback

**Example entries:**

- **Tel Aviv**: "The jump from a 3-room to a 5-room in Tel Aviv is roughly ₪1.5M — one of the steepest size premiums in Israel. If you're flexible on size, a 3-room at around ₪X.XM is the most realistic entry point. Upsizing later through TAMA 38 or renovation is a strategy many buyers here use."

- **Beer Sheva**: "One of Beer Sheva's biggest advantages is how narrow the gap between apartment sizes is. Moving from 3 rooms (₪X) to 4 rooms (₪X) costs roughly ₪XK — making the family upgrade far more realistic here than in most cities."

- **Modiin**: "Modi'in is a 4-room market — that's the sweet spot for the young families driving demand here. At ₪X.XM for a 4-room, it sits between the 3-room entry point and the 5-room premium. If you're buying for a family, that's where the competition is."

- **Herzliya**: "Even Herzliya's 3-room apartments command serious prices at ₪X.XM. The gap to a 5-room is around ₪X.XM — comparable to buying an entire apartment in some southern cities. Size upgrades here are a long-term play."

- **Haifa**: "Haifa's room-size pricing is remarkably accessible across the board. A 4-room at around ₪X.XM is roughly what you'd pay for a 3-room in Tel Aviv. If space matters to you, this is one of the few major cities where you can realistically get it."

All ~30 cities get unique entries reflecting their character and room-size dynamics.

**2. Update `src/components/city/PriceByApartmentSize.tsx`**

- Import `getCityRoomSizeInsight` and `InsightCard`
- Add a `useMemo` that computes metrics from `latestPrices` data and calls `getCityRoomSizeInsight`
- Render the InsightCard below the summary cards (before the chart), only in normal mode (not comparison mode) and only when data is available

### What stays the same
- Chart, tooltips, comparison mode, summary cards, source attribution — all unchanged
- Only adds an insight box between summary cards and chart

