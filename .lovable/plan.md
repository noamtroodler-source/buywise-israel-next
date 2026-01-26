
# Fix Header Badge to Show Combined Favorites Count (Properties + Projects)

## The Problem

When you click a project's favorite heart on the /projects page, the header favorites badge **does not update**. This is because:

| Source | What It Tracks | Used in Header? |
|--------|----------------|-----------------|
| `useFavorites()` | Property favorites (Buy/Rent) | ✅ Yes |
| `useProjectFavorites()` | Project favorites | ❌ No |

The header's `favoriteCount` only includes property favorites, so project favorites are never reflected in the badge.

---

## The Fix

Update the Header component to:
1. Import `useProjectFavorites` hook
2. Get `projectFavoriteIds` from that hook  
3. Combine both counts for the badge display

---

## File to Update

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Add project favorites to the total count |

---

## Technical Changes

### 1. Add Import

```tsx
import { useProjectFavorites } from '@/hooks/useProjectFavorites';
```

### 2. Get Project Favorite IDs

Add after the existing `useFavorites` call:

```tsx
const { favoriteIds } = useFavorites();
const { projectFavoriteIds } = useProjectFavorites();
```

### 3. Update the Count Calculation

Change from:
```tsx
const favoriteCount = favoriteIds?.length || 0;
```

To:
```tsx
const favoriteCount = (favoriteIds?.length || 0) + (projectFavoriteIds?.length || 0);
```

---

## Result

| Before | After |
|--------|-------|
| Badge shows: Properties only | Badge shows: Properties + Projects |
| Click project heart → No update | Click project heart → Badge updates instantly |

This works for both **logged-in users** (data from database) and **guests** (data from sessionStorage via FavoritesContext), since both `useFavorites` and `useProjectFavorites` already handle that logic internally.
