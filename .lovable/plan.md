

## Plan: Replace 12-Month Trend card with Room-Specific City Price Comparison

### What's changing
Replace **Card 3** ("12-Month Trend") with a new card that compares the listing's price against the city average for its specific bedroom count (3, 4, or 5-room apartments).

### Card 3 new behavior

**When bedrooms = 3, 4, or 5 and room-specific city data exists:**
- Header: `vs {city} {N}-Room Avg`
- Big number: `+X%` or `-X%` (property price vs city avg price for that room count)
- Subtitle: `{city} avg: ₪X,XXX,XXX`
- Icon: TrendingUp (red if above) / TrendingDown (green if below) / Minus (at par)
- Tooltip: "Compares this listing's price against the average {N}-room apartment sale price in {city}, based on government transaction data."

**When bedrooms ≤ 2, ≥ 6, null, or no room-specific data available:**
- Header: `vs {city} Avg` with muted icon
- "No data yet" in muted style
- Subtitle: "Room-specific city data unavailable" or similar BuyWise-friendly copy

### Technical changes

**`PropertyValueSnapshot.tsx`:**
1. Add new props: `roomSpecificCityAvgPrice?: number | null` (the total avg price, not per sqm)
2. Remove the `priceChange` logic from card 3 entirely
3. Card 3 computes: `compPercent = ((price - roomSpecificCityAvgPrice) / roomSpecificCityAvgPrice) * 100`
4. Only show comparison when `bedrooms` is 3-5 AND `roomSpecificCityAvgPrice` is available
5. Keep `priceChange` prop in interface (may be used elsewhere) but card 3 won't use it

**`MarketIntelligence.tsx`:**
1. Pass `roomSpecificCityAvgPrice={roomPrice?.avgPrice ?? null}` to `PropertyValueSnapshot`
2. The `useRoomSpecificCityPrice` hook already returns `avgPrice` (1-year averaged) — no hook changes needed

**`PropertyDetail.tsx`:**
1. If it also renders `PropertyValueSnapshot` directly, pass the same new prop there too (need to check if it uses `useRoomSpecificCityPrice`)

### No hook changes needed
`useRoomSpecificCityPrice` already returns `avgPrice` (4-quarter average total price) — we just need to pipe it through.

