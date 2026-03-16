

## Plan: Fix Persistence and Complete Mapping Run

### Problem
The `persistMappings` function fails with "ON CONFLICT DO UPDATE command cannot affect row a second time" because:
1. The unique constraint is on `(city, anglo_name)` but the AI correctly maps one Anglo name to multiple CBS neighborhoods (e.g., "Ganei Eilat" → "גנים א" AND "גנים ב")
2. When the batch upsert includes two rows with the same `(city, anglo_name)`, Postgres rejects it

### Fix

**Database migration**: Change the unique constraint from `(city, anglo_name)` to `(city, anglo_name, cbs_neighborhood_id)` to allow one Anglo name to map to multiple CBS neighborhoods.

```sql
ALTER TABLE neighborhood_cbs_mappings DROP CONSTRAINT neighborhood_cbs_mappings_city_anglo_name_key;
ALTER TABLE neighborhood_cbs_mappings ADD CONSTRAINT neighborhood_cbs_mappings_city_anglo_cbs_key UNIQUE (city, anglo_name, cbs_neighborhood_id);
```

**Edge function update**: Update `onConflict` in the upsert call to match the new constraint: `"city,anglo_name,cbs_neighborhood_id"`.

**Frontend hook update**: The `useNeighborhoodPrices` hook already handles multiple CBS IDs per Anglo name correctly (it fetches all approved mappings then groups prices by Anglo name), so no change needed there.

### After Fix
1. Redeploy the edge function
2. Rerun all cities (small ones via curl, large ones like Jerusalem/Haifa/Tel Aviv will run server-side even if the tool times out)
3. Verify data persisted in DB
4. Bulk approve all exact + high confidence mappings via direct SQL update

### Files Changed
| File | Change |
|------|--------|
| DB migration | Alter unique constraint |
| `supabase/functions/map-neighborhoods/index.ts` | Update `onConflict` parameter |

