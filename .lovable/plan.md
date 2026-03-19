## Plan: Import Anglo Community POI Data into Map

### What We're Building

Import ~432 POI entries from your CSV into the `map_pois` table, filtered and categorized for the map layers. This is primarily a data processing + import task, with minor schema and UI updates.

### Data Filtering (What Gets Excluded)

Based on your instructions:

- **Yeshivas/Seminaries for year-abroad students** — entries like Mayanot, Neve Yerushalayim, Shaalvim for Women, Darchei Binah, Midreshet Lindenbaum, Yeshivat Hakotel, Midreshet B'erot, Mayanot Women's, Ohr Torah Stone Seminary, etc. (subcategory = `Yeshiva` or `Seminary` where notes indicate year-abroad/post-HS programs)
- **Restaurants and cafes** — Sarona Market, Shuk HaCarmel, Tmol Shilshom, Cafe Cafe, Cafe Landwer, Deli Bistro, Ir Yamim Mall (cafe), Carmel Winery, etc.
  &nbsp;

### What Gets Included (~300 entries estimated)


| Category  | Subcategories Kept                                                                                      | Map Layer Toggle |
| --------- | ------------------------------------------------------------------------------------------------------- | ---------------- |
| `shul`    | Chabad, Orthodox, Modern Orthodox, Conservative, Reform, Sephardi, Carlebach, Egalitarian, Dati Leumi   | 🕍 Shuls         |
| `school`  | Elementary, High School, Coed, International, Ulpan (local schools relevant to buyers, NOT year-abroad) | 🏫 Schools       |
| `medical` | Hospital-ER, Family Doctor, Specialist, Pediatrician, Dentist, OB-GYN                                   | 🏥 Medical       |
| `mikveh`  | All mikvehs                                                                                             | 🛁 Mikvehs       |
| `grocery` | Supermarkets only (Rami Levy, Shufersal, Super Deal)                                                    | 🛒 Grocery       |


### Schema Changes

Add 3 columns to `map_pois` via migration:

- `denomination` (TEXT, nullable) — e.g., "Chabad", "Modern Orthodox", "Conservative"
- `english_level` (TEXT, nullable) — "Anglo Hub", "English Primary", "English Friendly", "English Available"
- `geocode_status` (TEXT, default `'pending'`) — track geocoding state

### Geocoding Strategy

Write an edge function that batch-geocodes entries using the Google Maps Geocoding API (key already in secrets as `GOOGLE_MAPS_API_KEY`). The script will:

1. Parse the CSV, filter out excluded entries
2. Normalize categories (SHUL → shul, MEDICAL → medical, DAILY/Mikveh → mikveh, DAILY/Supermarket → grocery)
3. Call Google Geocoding API for each address+city
4. Insert into `map_pois` with coordinates, marking `geocode_status` as `success` or `failed`
5. Entries that fail geocoding are still stored (with null coords) for later manual fix

### UI Updates

1. **LayersMenu.tsx** — Add toggles for Medical (🏥), Mikvehs (🛁), and Grocery (🛒)
2. **POILayer.tsx** — Add `denomination` and `english_level` to the InfoWindow popup, showing english_level as a colored badge
3. **PropertyMap.tsx** — Wire new layer toggles to `activePoiCategories`
4. **useMapPois.ts** — Update the `MapPoi` interface to include `denomination`, `english_level`

### Implementation Steps

1. Run migration to add `denomination`, `english_level`, `geocode_status` columns
2. Create edge function `geocode-and-import-pois` that reads the CSV data, filters, geocodes, and inserts
3. Run the import (invoke the edge function)
4. Update LayersMenu, POILayer, PropertyMap, useMapPois for the new categories and fields
5. Verify data appears on map at zoom 13+

### Technical Details

- The `map_pois` table currently has `latitude NUMERIC NOT NULL` — we'll alter this to allow NULL for failed geocodes
- Google Geocoding API rate limit: ~50 QPS — we'll add 200ms delays between calls
- Total API calls: ~300 entries × 1 call each = ~300 calls (well within free tier)
- All 25 platform cities are represented in the data