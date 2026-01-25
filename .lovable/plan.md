
# Add Instant Removal Animation for Favorites

## The Problem

When you click the heart icon on a property card in the Favorites page, the property is removed from your favorites, but the card doesn't disappear immediately. There's a delay while the query refetches from the server.

## The Solution

Add **optimistic updates** so the card disappears instantly when you click the heart, without waiting for the server response. If the server request fails, the card will reappear with an error message.

---

## Implementation

### File: `src/hooks/useFavorites.tsx`

Update the `removeFavorite` mutation to use optimistic updates:

**Changes:**

1. Add `onMutate` to immediately remove the property from the cached favorites list
2. Add `onError` rollback to restore the property if the deletion fails
3. Add `onSettled` to ensure the cache is synced after the mutation completes

```typescript
const removeFavorite = useMutation({
  mutationFn: async (propertyId: string) => {
    // ... existing deletion logic
  },
  onMutate: async (propertyId) => {
    // Cancel any in-flight queries
    await queryClient.cancelQueries({ queryKey: ['favorites', user?.id] });
    await queryClient.cancelQueries({ queryKey: ['favoriteIds', user?.id] });
    
    // Snapshot current state for rollback
    const previousFavorites = queryClient.getQueryData(['favorites', user?.id]);
    const previousIds = queryClient.getQueryData(['favoriteIds', user?.id]);
    
    // Optimistically remove from cache
    queryClient.setQueryData(['favorites', user?.id], (old: any[]) => 
      old?.filter(f => f.property_id !== propertyId) || []
    );
    queryClient.setQueryData(['favoriteIds', user?.id], (old: string[]) =>
      old?.filter(id => id !== propertyId) || []
    );
    
    return { previousFavorites, previousIds };
  },
  onError: (error, propertyId, context) => {
    // Rollback on error
    if (context?.previousFavorites) {
      queryClient.setQueryData(['favorites', user?.id], context.previousFavorites);
    }
    if (context?.previousIds) {
      queryClient.setQueryData(['favoriteIds', user?.id], context.previousIds);
    }
    toast.error('Failed to remove property');
  },
  onSuccess: () => {
    toast.success('Property removed from favorites');
  },
  onSettled: () => {
    // Refetch to ensure sync with server
    queryClient.invalidateQueries({ queryKey: ['favorites'] });
    queryClient.invalidateQueries({ queryKey: ['favoriteIds'] });
  },
});
```

---

## How It Works

| Step | Before | After |
|------|--------|-------|
| Click heart | Wait for server response | Card disappears instantly |
| Server confirms | Card finally disappears | Cache syncs silently |
| Server fails | Error toast, card still visible | Error toast, card reappears |

---

## User Experience

### Before
1. Click heart on property card
2. Wait 200-500ms while request completes
3. Card disappears

### After
1. Click heart on property card
2. Card disappears instantly (optimistic update)
3. Server syncs in background
4. If error, card reappears with error message

This creates a snappy, responsive feel that matches modern app expectations.

---

## Technical Details

- Uses React Query's built-in optimistic update pattern
- Maintains data integrity with rollback on error
- Works for both logged-in users (database) and guests (sessionStorage)
- No changes needed to the UI components — the `PropertyCard` and `FavoriteButton` will automatically reflect the optimistic state
