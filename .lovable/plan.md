

## Add Room-Specific City Pricing to Affordability Calculator

### What It Does
Adds a city selector to the calculator inputs and shows a "What can you buy?" card that compares the user's max budget against actual 3, 4, and 5-room prices in the selected city. Each room type shows whether it's "Within budget", "Stretch", or "Over budget".

### Changes

**1. New hook: `src/hooks/useCityRoomPrices.ts`**
- Fetches latest `avg_price_nis` from `city_price_history` for rooms 3, 4, 5 in a given city (single query with `.in('rooms', [3, 4, 5])`)
- Returns `{ rooms: 3, avgPrice: number }[]`
- Reuses the same normalization pattern as `useRoomSpecificCityPrice`

**2. New component: `src/components/tools/affordability/CityRoomPriceBreakdown.tsx`**
- Takes `city`, `maxBudget`, and room price data
- Renders 3 rows: "A typical 3-room in [City] costs ₪X" with a colored badge (green = within budget, amber = stretch 90-100%, red = over)
- Placed in the right column, below the existing budget card

**3. Edit: `src/components/tools/AffordabilityCalculator.tsx`**
- Add a city `Select` dropdown in the left column (Debts & Savings card or new small card)
  - Pre-populate from `buyerProfile.target_cities[0]` if available
  - Options: query distinct cities from `city_price_history` (or use a static list of the 25 supported cities)
- Import and render `CityRoomPriceBreakdown` in the right column after the main budget card
- Pass `calculations.maxPropertyPrice` and selected city

### Data Flow
```text
City selector (input) life
    → useCityRoomPrices(selectedCity) 
    → returns [{rooms: 3, avg: 1.5M}, {rooms: 4, avg: 2.1M}, {rooms: 5, avg: 2.8M}]
    → CityRoomPriceBreakdown compares each against maxPropertyPrice
    → Shows colored badges per room type
```

### UI Placement
- City selector: new card in left column after "Debts & Savings", titled "Target City" with a Building2 icon
- Room breakdown: in right column, below the main budget card — a simple card with 3 rows

### No DB Changes Required
All data comes from existing `city_price_history` table.

