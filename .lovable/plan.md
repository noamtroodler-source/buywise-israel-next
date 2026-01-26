
# Fix: Favorites Page Showing Empty State After Removing a Favorite

## Problem Summary

When you remove a favorite project (as a guest), the Favorites page briefly flashes to the "no favorites" empty state, even though you still have other favorites. This happens because of a race condition between React state updates and React Query invalidation.

---

## Root Cause

The bug is in **both** `useProjectFavorites.tsx` and `useFavorites.tsx`:

### How the Bug Occurs

1. When you click to remove a favorite, the mutation runs
2. For guests, it updates the context state: `setGuestProjectFavoriteIds(current => current.filter(...))`
3. The `onSuccess` callback immediately runs: `queryClient.invalidateQueries(...)`
4. The query that fetches project details has `guestProjectFavoriteIds` in its query key
5. **Race condition**: The invalidation happens before React has finished updating `guestProjectFavoriteIds`
6. The query refetches with the OLD IDs, or becomes disabled if the array appears empty momentarily
7. This causes `projectFavorites` to return empty, triggering the empty state view

### Why Property Favorites (Buy/Rent) Are Less Affected

The `useFavorites` hook has similar code, but the bug is less noticeable because:
- The `favorites` array for properties includes the `properties` data inline
- The structure slightly differs, but the same race condition exists

---

## Solution

Remove the unnecessary `queryClient.invalidateQueries` calls for guest users. Since we're already updating the context state synchronously, React Query will automatically refetch because the query key changes when `guestProjectFavoriteIds` updates.

### Changes to `src/hooks/useProjectFavorites.tsx`

**Remove the guest invalidation in `onSuccess`** (lines 137-145):

```tsx
// BEFORE
onSuccess: () => {
  if (user) {
    queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
    queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
  } else {
    queryClient.invalidateQueries({ queryKey: ['guest-project-favorites-data'] });  // ❌ Remove this
  }
  toast.success('Project removed from favorites');
}

// AFTER
onSuccess: () => {
  if (user) {
    queryClient.invalidateQueries({ queryKey: ['projectFavorites'] });
    queryClient.invalidateQueries({ queryKey: ['projectFavoriteIds'] });
  }
  // Guest updates are reactive via context - no invalidation needed
  toast.success('Project removed from favorites');
}
```

**Also fix `addProjectFavorite`** (lines 100-114) - same pattern:

```tsx
// BEFORE
onSuccess: () => {
  if (user) {
    // ... user invalidations
  } else {
    queryClient.invalidateQueries({ queryKey: ['guest-project-favorites-data'] });  // ❌ Remove this
    toast.success(...);
  }
}

// AFTER - Remove the guest invalidation, keep the toast
```

### Changes to `src/hooks/useFavorites.tsx`

**Fix `removeFavorite` onSuccess** (lines 185-190):

```tsx
// BEFORE
onSuccess: () => {
  if (!user) {
    queryClient.invalidateQueries({ queryKey: ['guest-favorite-properties'] });  // ❌ Remove this
  }
  toast.success('Property removed from favorites');
}

// AFTER
onSuccess: () => {
  toast.success('Property removed from favorites');
  // Guest updates are reactive via context - query key includes guestFavoriteIds
}
```

**Fix `addFavorite` onSuccess** (lines 117-131):

```tsx
// BEFORE
onSuccess: (_, variables) => {
  if (user) {
    // ... user invalidations
  } else {
    queryClient.invalidateQueries({ queryKey: ['guest-favorite-properties'] });  // ❌ Remove this
    toast.success(...);
  }
}

// AFTER - Remove the guest invalidation, keep the toast
```

---

## Why This Fix Works

1. **Context state is the source of truth** for guest favorites (`guestFavoriteIds` / `guestProjectFavoriteIds`)
2. **Query keys include the IDs array**: `['guest-project-favorites-data', guestProjectFavoriteIds]`
3. When context updates, the query key changes, triggering an automatic refetch
4. Removing the manual `invalidateQueries` eliminates the race condition

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useProjectFavorites.tsx` | Remove guest invalidation calls in both `addProjectFavorite` and `removeProjectFavorite` mutations |
| `src/hooks/useFavorites.tsx` | Remove guest invalidation calls in both `addFavorite` and `removeFavorite` mutations |

---

## Testing Checklist

After the fix:

- [ ] As a guest, add multiple projects to favorites
- [ ] Remove one project - remaining projects should stay visible
- [ ] Remove all projects - empty state should appear
- [ ] As a guest, add multiple properties (buy) to favorites
- [ ] Remove one property - remaining properties should stay visible
- [ ] As a guest, add multiple rentals to favorites  
- [ ] Remove one rental - remaining rentals should stay visible
- [ ] Switching between tabs (Buy/Rent/Projects) works correctly
- [ ] Toast messages still appear when adding/removing favorites
