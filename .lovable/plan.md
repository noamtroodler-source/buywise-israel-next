

## Add Room-Specific City Average to Market Intelligence

### What we're doing
When a property listing has bedrooms info (e.g., 4 rooms), fetch the actual average price for that room count from `city_price_history` and use it instead of the generic city average_price_sqm. This gives buyers a much more relevant comparison — "vs Ashdod 4-Room Avg" instead of "vs Ashdod Average."

### Implementation

**1. New hook: `src/hooks/useRoomSpecificCityPrice.ts`**

A lightweight hook that queries `city_price_history` for a specific city + room count:
- Fetches the latest quarter's `avg_price_nis` for the given room count
- Finds the same quarter one year prior for YoY change
- Derives price/sqm using standard size estimates (3-room≈75sqm, 4-room≈100sqm, 5-room≈130sqm)
- Returns `{ avgPrice, avgPriceSqm, yoyChange, quarter, year }` or null

**2. Update `MarketIntelligence.tsx`**

- Import and call `useRoomSpecificCityPrice(citySlug, property.bedrooms)`
- When room-specific data is available, override `cityData.average_price_sqm` and `cityData.yoy_price_change` with room-specific values before passing to `PropertyValueSnapshot`
- Also pass room-specific data to the AI insight input (`room_avg_price`, `room_avg_price_sqm`, `room_yoy_change`)

**3. Update `PropertyValueSnapshot.tsx`**

- Add optional `roomCount` prop
- When `roomCount` is provided, change the "vs City Average" label to "vs {city} {roomCount}-Room Avg"
- Tooltip text updated accordingly

**4. Update AI insight input (optional enrichment)**

- Add `room_avg_price` and `room_yoy_change` fields to the insight input so the edge function can reference room-specific context in its narrative

### What stays the same
- Fallback: when room-specific data isn't available (2-room, 6+ room, or missing data), uses the existing generic city average
- All other Market Intelligence layout, verdict badges, comps, AI insight positioning unchanged

