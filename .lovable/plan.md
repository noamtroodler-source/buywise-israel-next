
# Allow Guest Users to Access Favorites Page

## The Problem

Currently, when a guest user clicks the favorites heart icon in the header, they're redirected to the sign-in page (`/auth?redirect=/favorites`) instead of seeing their saved properties.

This happens because the `/favorites` route is wrapped with `ProtectedRoute` in `src/App.tsx` (lines 202-206), which blocks all non-authenticated users.

## The Solution

Remove the `ProtectedRoute` wrapper from the `/favorites` route. The Favorites page already has built-in logic to handle guest users gracefully, including:

- A `GuestSignupNudge` banner that encourages sign-up
- Session storage-based favorites display
- Clear messaging about browser-only saves

## Implementation

### File: `src/App.tsx`

**Before:**
```tsx
<Route path="/favorites" element={
  <ProtectedRoute>
    <Favorites />
  </ProtectedRoute>
} />
```

**After:**
```tsx
<Route path="/favorites" element={<Favorites />} />
```

## Why This Works

The Favorites page (`src/pages/Favorites.tsx`) already contains:

1. **Guest detection**: Checks if `user` exists
2. **Guest favorites support**: Uses `useFavorites` hook which loads from `sessionStorage` for guests
3. **Signup nudge**: Shows a banner encouraging guests to create an account:
   > "These properties are saved to this browser only. Create a free account to keep them forever and get price drop alerts."

## Result

- Guests can now click the heart icon and see their saved properties immediately
- They'll see a friendly banner explaining the benefits of signing up
- No code changes needed to the Favorites page itself — it's already guest-ready
