

## Plan: Fix Neighborhood Mapping Issues

### Problems Found

1. **City name mismatches** between `neighborhood_price_history` and `cities` tables:
   - `Maale Adumim` vs `Ma'ale Adumim`
   - `Modiin` vs `Modi'in`  
   - `Raanana` vs `Ra'anana`

2. **Hardcoded city list in frontend is wrong** — includes cities not in CBS data (Karmiel, Givatayim, Nahariya, Rehovot, Rishon LeZion) and misses cities that ARE in CBS data (Eilat, Givat Shmuel, Hod HaSharon, Maale Adumim, Pardes Hanna).

3. **The edge function already works** — Haifa completed successfully (23 mappings in ~37 seconds). The test tool just has a shorter timeout than the actual function.

### Fix 1: Edge function — normalize city names for matching

Add a name normalization map in the edge function so that when querying Anglo data from `cities`, it matches CBS names like `Modiin` → `Modi'in`. This way both sides find each other regardless of apostrophes.

### Fix 2: Frontend — dynamically fetch city list instead of hardcoding

Instead of the hardcoded `CBS_CITIES` array, the frontend should:
1. Query `SELECT DISTINCT city_en FROM neighborhood_price_history ORDER BY city_en` to get actual CBS cities
2. Use those as the list to iterate over

### Fix 3: Frontend — add authorization header

The function calls are missing the anon key header, which may cause issues. Add the standard `apikey` header.

### Changes

**`supabase/functions/map-neighborhoods/index.ts`**
- Add a city name normalization map: `{ "Maale Adumim": "Ma'ale Adumim", "Modiin": "Modi'in", "Raanana": "Ra'anana" }`
- When querying the `cities` table, use the normalized name to find the matching city
- Keep CBS name as the canonical key for grouping

**`src/pages/admin/MapNeighborhoods.tsx`**
- Remove hardcoded `CBS_CITIES` array
- On mount or before running, fetch distinct `city_en` values from `neighborhood_price_history`
- Use the dynamic list for iteration
- Add proper `apikey` header to fetch calls

