

## Plan: Remove 7 Non-Live Cities + 2 Orphan City References

### Cities to Remove
These 7 cities exist in the database and code but are **not on the Areas page**: Bat Yam, Givatayim, Holon, Givat Ze'ev, Nahariya, Rosh HaAyin, Shoham.

Additionally, **Yokneam** and **Kiryat Tivon** have code references (insights, hero images, matchers) but aren't even in the database or on the Areas page -- pure orphan code.

### Database Impact
- No related data in `city_price_history`, `neighborhood_price_history`, `neighborhood_cbs_mappings`, `sold_transactions`, or `properties` for these 7 cities -- just the 7 rows in the `cities` table itself. Clean deletion.

### Changes

**1. Database** -- Delete 7 city rows:
```sql
DELETE FROM cities WHERE slug IN ('bat-yam','givat-zeev','givatayim','holon','nahariya','rosh-haayin','shoham');
```

**2. Code cleanup** (9 files):

| File | Change |
|------|--------|
| `src/components/city/cityInsights.ts` | Remove entries for bat-yam, givatayim, holon, givat-zeev, nahariya, shoham, yokneam, kiryat-tivon |
| `src/components/city/cityRoomSizeInsights.ts` | Same removals |
| `src/lib/cityHeroImages.ts` | Remove imports + map entries for all 9 slugs |
| `src/lib/utils/cityMatcher.ts` | Remove aliases for Bat Yam, Holon, Shoham, Yokneam, Kiryat Tivon, Givatayim, Nahariya |
| `src/lib/utils/districtMapping.ts` | Remove entries for Givatayim, Bat Yam, Holon, Rosh HaAyin, Nahariya, Yokneam, Kiryat Tivon, Givat Zeev |
| `src/lib/angloNeighborhoodTags.ts` | Remove `givat-zeev` entry |
| `src/components/tools/FindYourPlaceWorkshop.tsx` | Replace Bat Yam, Holon, Shoham, Nahariya, Givatayim with cities that ARE on the platform |
| `src/pages/agency/AgencySettings.tsx` | Remove Holon from the `allCities` list |
| `supabase/functions/ask-buywise/index.ts` | Remove all 7 from `KNOWN_CITIES` array |

**3. Edge function** (`backfill-coordinates/index.ts`) -- Remove coordinate entries for the 7 cities + Yokneam.

**4. Update memory** -- The platform whitelist drops from 32 to 25 cities.

### What stays
- Hero image asset files stay on disk (tree-shaking removes unused imports from the bundle; deleting asset files is optional cleanup)
- Train station data in `trainStations.ts` stays (those are real infrastructure data points, not city market pages)

