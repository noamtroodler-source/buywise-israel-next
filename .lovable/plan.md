

## Make Saves Count Permanent (Never Decrease)

### Problem
Currently, the saves count for a property is calculated by counting active rows in the `favorites` and `guest_property_saves` tables. When someone unsaves a property, the row is deleted and the count drops. You want saves to represent cumulative interest -- once someone saves, it counts forever, even if they later unsave.

### Solution
Add a `total_saves` column to the `properties` table that only increments (never decrements). Update the RPC function and the unsave logic accordingly.

### Database Changes

**1. Add `total_saves` column to `properties` table**
- New integer column, default 0, not null
- Initialize it with the current count from `favorites` + `guest_property_saves` so existing data is preserved

**2. Update `get_property_saves_count` RPC**
- Change it to simply return `total_saves` from the `properties` table instead of counting rows

**3. Create a trigger to auto-increment `total_saves`**
- On INSERT into `favorites` table: increment `properties.total_saves` by 1
- On INSERT into `guest_property_saves` table: increment `properties.total_saves` by 1
- No trigger on DELETE -- the count never goes down

**4. Add `total_saves` to `projects` table too**
- Same pattern: a permanent counter that increments on save, never decrements
- Add trigger on INSERT into `project_favorites`

### Code Changes

**`src/hooks/useFavorites.tsx`**
- Remove the `queryClient.invalidateQueries({ queryKey: ['savesCount', propertyId] })` call from the `removeFavorite.onSuccess` handler (line 220) -- unsaving should not affect the displayed count
- Keep the invalidation in `addFavorite.onSuccess` (line 134) so the count updates when saving

### Files to Modify

| File | Change |
|------|--------|
| Database migration | Add `total_saves` column to `properties` and `projects`; backfill from current data; create increment-only triggers; update RPC |
| `src/hooks/useFavorites.tsx` | Remove saves count invalidation on unsave |

