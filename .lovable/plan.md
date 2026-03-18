

## Replace City Anchors with Anglo-Specific Landmarks (v3)

### What changes

The current city anchors (Orientation / Daily Life / Mobility) will be fully replaced with the new Anglo-focused framework: **Shul**, **Supermarket**, and **Defining Landmark** — 3 per city across all 32 cities.

### Database migration

**Single SQL migration** that:
1. Deletes all existing rows from `city_anchors`
2. Inserts 96 new rows (32 cities × 3 landmarks) with:
   - `anchor_type`: `shul`, `supermarket`, or `landmark` (replaces old `orientation`, `daily_life`, `mobility`)
   - `name`: English name from the document
   - `name_he`: Hebrew name from the document
   - `description`: "Why it matters" text
   - `latitude` / `longitude`: Coordinates from the document
   - `icon`: `heart` for shul, `shopping-bag` for supermarket, `map-pin` for landmark
   - `display_order`: 1, 2, 3 respectively

**New cities getting anchors** (exist in `cities` table but had no anchors): Bat Yam, Givat Ze'ev, Givatayim, Holon, Nahariya, Rosh HaAyin, Shoham

### Code changes (~4 files)

| File | Change |
|------|--------|
| `useCityAnchors.ts` | Update `anchor_type` union type to `'shul' \| 'supermarket' \| 'landmark'` |
| `CityAnchorCard.tsx` | Update `anchorTypeLabels` map: shul → "Community Shul", supermarket → "Supermarket", landmark → "City Landmark". Update icon mapping if needed |
| `CityAnchorsLayer.tsx` | Update `ANCHOR_COLORS` map for new types |
| `PropertyLocation.tsx` | Update `category` mapping in `generateMapPOIs` for new anchor types |

### What stays the same
- The `city_anchors` table schema (no structural changes)
- The `CityAnchorCard` component layout and travel-time logic
- Train station layer (separate system, unaffected)
- Saved places layer (unaffected)

