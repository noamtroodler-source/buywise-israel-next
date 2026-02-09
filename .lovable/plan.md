
## Fix: Compare List Showing Items That Aren't in Favorites

### Problem
The compare list (stored in `sessionStorage`) is completely independent from the favorites list. You can add properties to compare, then unfavorite them (or have no favorites at all), and the compare bar still shows those items at the bottom of the page.

### Root Cause
`CompareContext` persists IDs in `sessionStorage` but never checks whether those IDs are still in the user's favorites. The only cleanup happens when `removeFavorite` is called (which calls `removeFromCompare`), but this doesn't cover:
- Session data from a previous browsing session where favorites were cleared differently
- Stale sessionStorage data

### Solution
Add a synchronization effect in `CompareContext` that filters out any compare IDs that are not in the current favorites list. This ensures the compare list is always a subset of favorites.

**File: `src/contexts/CompareContext.tsx`**
- Import `useFavoritesContext` from `FavoritesContext` (not `useFavorites` to avoid circular deps)
- Add a `useEffect` that runs whenever `compareIds` or the favorite IDs change
- Filter out any compare IDs that are not present in the combined favorite IDs (property favorites + project favorites)
- This acts as a passive guard -- if any compare ID isn't favorited, it gets removed automatically

### Technical Detail

```typescript
// In CompareProvider, after existing state setup:
const { guestFavorites, guestProjectFavoriteIds } = useFavoritesContext();

// Also need to read DB favorite IDs for logged-in users
// We'll query favoriteIds from the existing useQuery pattern

useEffect(() => {
  // Build set of all valid favorite IDs
  const validIds = new Set([
    ...guestFavorites.map(f => f.property_id),
    ...guestProjectFavoriteIds,
    ...dbFavoriteIds,  // from auth user's DB favorites
  ]);
  
  const filtered = compareIds.filter(id => validIds.has(id));
  if (filtered.length !== compareIds.length) {
    setCompareIds(filtered);
    if (filtered.length === 0) setCompareCategory(null);
  }
}, [compareIds, guestFavorites, guestProjectFavoriteIds, dbFavoriteIds]);
```

However, since `CompareContext` is a context provider and shouldn't use hooks like `useQuery` directly, the cleaner approach is:

**Option chosen**: Move the sync logic into a small component rendered inside both providers, or pass favorite IDs into CompareProvider. The simplest approach:

1. **`src/contexts/CompareContext.tsx`** -- Accept an optional `validFavoriteIds` prop or add a `syncWithFavorites(ids: string[])` method
2. **`src/components/CompareSync.tsx`** (new file) -- A tiny component that sits inside both providers, reads favorite IDs from `useFavorites`, and calls sync on CompareContext

Actually, the simplest fix with minimal changes:

**`src/contexts/CompareContext.tsx`**:
- Add a new method `syncCompareWithFavorites(favoriteIds: string[])` to the context
- This filters `compareIds` to only include IDs present in `favoriteIds`

**`src/pages/Favorites.tsx`**:
- Call the sync method with current `favoriteIds` on mount/change, since this is where the compare bar is shown
- This ensures that by the time the user sees the compare bar on the favorites page, stale items are cleaned out

### Files to Modify

| File | Change |
|------|--------|
| `src/contexts/CompareContext.tsx` | Add `syncCompareWithFavorites` method to context |
| `src/pages/Favorites.tsx` | Call sync on mount with current favorite IDs to prune stale compare items |
