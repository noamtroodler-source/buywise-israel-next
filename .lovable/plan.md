

## Fix Mock Property Prices and Dates Using Real Market Data

### Problem
Both seed functions use hardcoded `CITY_MULTIPLIERS` and `BASE_PRICE` constants that produce prices wildly inconsistent with verified data. For example, Haifa mocks generate ~₪32,500/m² while the verified `cities.average_price_sqm` is ~₪19,197. Rentals have the same issue. Listing dates also cluster unrealistically.

### Solution

Three-part fix: (1) SQL update for existing data, (2) update both seed edge functions to use real data going forward.

---

### Part 1: SQL Data Update (via insert tool)

A single SQL statement that updates all existing mock properties in-place:

**Dates** — Randomize `created_at` using weighted distribution:
- 10% today/yesterday, 20% 2-5 days, 30% 6-14 days, 25% 15-45 days, 15% 45-90 days

**Resale prices** — Join `properties` to `cities` on city name:
- Use `cities.average_price_sqm * properties.size_sqm * random_variance(0.75–1.30)`
- Round to nearest ₪10,000
- Additionally attempt neighborhood-level adjustment: join `neighborhood_cbs_mappings` + `neighborhood_price_history` to get the neighborhood's avg price for the matching room count (bedrooms + additional_rooms). If a neighborhood match exists, blend it 70/30 with city avg so listings in expensive neighborhoods skew higher and vice versa.

**Rental prices** — Join `properties` to `cities`:
- Map bedrooms+additional_rooms to Israeli room count
- For 3-room: use `rental_3_room_min` to `rental_3_room_max`
- For 4-room: use `rental_4_room_min` to `rental_4_room_max`  
- For 5+-room: use `rental_5_room_min` to `rental_5_room_max`
- For 2-room: use `rental_3_room` range × 0.75
- Random within range, rounded to ₪100

---

### Part 2: Update `seed-demo-data/index.ts`

- Remove hardcoded `BASE_PRICE`, `BASE_RENT`, and `CITY_MULTIPLIERS`/`priceMultiplier` from `CITY_COORDS`
- At startup, fetch `cities` table including `average_price_sqm`, `rental_3/4/5_room_min/max`
- Also fetch latest `neighborhood_price_history` + `neighborhood_cbs_mappings` for neighborhood-aware pricing
- Sale price = `city.average_price_sqm * sizeSqm * variance(0.75-1.30)`, optionally adjusted by neighborhood avg
- Rental price = random within city's verified rental range for the matching room count
- Keep existing `getListingAge()` distribution for dates (already good)
- Assign random neighborhoods from the approved CBS mappings for each city

### Part 3: Update `seed-additional-properties/index.ts`

Same changes as Part 2:
- Remove `CITY_MULTIPLIERS`, `baseSalePricePerSqm`, `baseRentPricePerSqm`
- Fetch `cities` data at runtime for pricing
- Use verified rental ranges
- Already has `getListingAge()` — keep it

---

### Files to Change

| File | Change |
|------|--------|
| SQL via insert tool | Update all existing property prices + dates in-place |
| `supabase/functions/seed-demo-data/index.ts` | Replace hardcoded pricing with cities table + neighborhood data |
| `supabase/functions/seed-additional-properties/index.ts` | Same — replace hardcoded pricing with cities table data |

