
# Fix Favorites Count & Reactivity

## Problem Summary
The favorites count badge in the header doesn't update correctly when you:
1. Add a property to favorites (count stays at old value)
2. Remove a property from favorites (count doesn't decrease)
3. The badge can show "1" even when no properties are actually saved

## Root Cause
Each component that calls `useFavorites()` creates its own local state for guest favorites. When one component updates sessionStorage, other components (like the header) still hold stale data. There's no shared state mechanism for guests.

## Solution: Shared State via React Context

Create a shared favorites context that all components read from, ensuring updates propagate everywhere instantly.

---

## Implementation Plan

### 1. Create FavoritesContext (New File)
**File:** `src/contexts/FavoritesContext.tsx`

Create a React Context that wraps the application and provides:
- A single source of truth for `guestFavorites` state
- Synced with sessionStorage on changes
- Triggers re-renders across all consuming components

```text
FavoritesProvider
├── guestFavorites (state)
├── setGuestFavorites (setter)
├── refreshFromStorage (manual refresh utility)
└── Children consume via useFavoritesContext()
```

### 2. Refactor useFavorites Hook
**File:** `src/hooks/useFavorites.tsx`

**Changes:**
- Remove local `guestFavorites` useState
- Consume `guestFavorites` and `setGuestFavorites` from FavoritesContext
- When adding/removing guest favorites, update via context setter (not local state)
- This ensures all hook instances share the same state

**Key Code Changes:**
- Line 21: Replace `useState` with context consumption
- Line 24-28: Remove the `useEffect` that loads from sessionStorage (context handles this)
- Lines 105-109, 149-152: Use context's `setGuestFavorites` instead of local setter

### 3. Wrap App with FavoritesProvider
**File:** `src/App.tsx`

Add `<FavoritesProvider>` around the application tree, similar to how `CompareProvider` and `AuthProvider` are set up.

### 4. Apply Same Fix to Project Favorites (Optional but Recommended)
**File:** `src/hooks/useProjectFavorites.tsx`

If the user wants a combined count (properties + projects) in the header, apply the same context pattern to project favorites.

---

## Technical Details

### FavoritesContext Implementation

```text
// Pseudocode structure
const FavoritesContext = createContext()

export function FavoritesProvider({ children }) {
  // Initialize from sessionStorage on mount
  const [guestFavorites, setGuestFavorites] = useState(() => 
    safeSessionGet(GUEST_FAVORITES_KEY, [])
  )
  
  // Sync to sessionStorage whenever state changes
  useEffect(() => {
    if (guestFavorites.length > 0) {
      safeSessionSet(GUEST_FAVORITES_KEY, guestFavorites)
    } else {
      // Clear storage when empty to prevent stale "1" counts
      safeSessionRemove(GUEST_FAVORITES_KEY)
    }
  }, [guestFavorites])
  
  return (
    <FavoritesContext.Provider value={{ guestFavorites, setGuestFavorites }}>
      {children}
    </FavoritesContext.Provider>
  )
}
```

### Updated useFavorites Flow

```text
Before (Broken):
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Header     │    │ PropertyCard│    │ FavoritePage│
│ useFavorites│    │ useFavorites│    │ useFavorites│
│ [state: 0]  │    │ [state: 1]  │    │ [state: 1]  │
└─────────────┘    └─────────────┘    └─────────────┘
       ↑ No sync between instances

After (Fixed):
┌────────────────────────────────────────────────────┐
│            FavoritesProvider (Context)             │
│                [guestFavorites: []]                │
├────────────────────────────────────────────────────┤
│ ┌───────────┐  ┌─────────────┐  ┌───────────────┐ │
│ │  Header   │  │ PropertyCard│  │ FavoritesPage │ │
│ │  reads 0  │  │  reads 0    │  │   reads 0     │ │
│ └───────────┘  └─────────────┘  └───────────────┘ │
└────────────────────────────────────────────────────┘
       ↑ All read from same shared state
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/contexts/FavoritesContext.tsx` | Create | Shared state context for guest favorites |
| `src/hooks/useFavorites.tsx` | Modify | Use context instead of local state |
| `src/App.tsx` | Modify | Wrap app with FavoritesProvider |

---

## Expected Behavior After Fix

1. **Add favorite**: Badge count increases immediately everywhere
2. **Remove favorite**: Badge count decreases immediately everywhere
3. **Empty favorites**: Badge disappears completely (no stale "1")
4. **Page refresh**: Count persists correctly from sessionStorage
5. **Close browser**: Session clears (expected sessionStorage behavior)

---

## Edge Cases Handled

- **User logs in**: Context clears guest state, switches to DB-backed favorites
- **User logs out**: Guest state becomes active again
- **Empty array cleanup**: Removes sessionStorage key when empty to prevent phantom counts
- **Multiple tabs**: Each tab has its own session (expected browser behavior)
