
# Add Favorites Access for Guest Users

## The Problem

Currently, guest users who save properties to favorites have no way to access the Favorites page from the header navigation:

- **Desktop**: Only "Sign In" and "Sign Up" buttons are shown
- **Mobile**: The "Saved Properties" link only appears for logged-in users

This creates a confusing experience where guests can save properties but can't find them.

---

## The Solution

Add a heart icon with favorites count badge to the header for **all users** (guests and authenticated), and ensure the mobile menu includes a Favorites link for guests.

### Desktop View (Before)
```text
[Preferences] [Sign In] [Sign Up]
```

### Desktop View (After)
```text
[Preferences] [Heart with badge] [Sign In] [Sign Up]
```

### Mobile Menu (Before for Guests)
```text
Buy | Rent | Projects | ... | Sign In | Sign Up
```

### Mobile Menu (After for Guests)
```text
Saved Properties (with badge) | Buy | Rent | Projects | ... | Sign In | Sign Up
```

---

## Implementation Details

### 1. Desktop Header Changes

Add a favorites icon button between the Preferences dialog and the Sign In/Sign Up buttons:

- Use a `Button` with `variant="ghost"` and `size="icon"` 
- Include the `Heart` icon
- Show a small `Badge` with the count when `favoriteCount > 0`
- Link to `/favorites`
- Styling matches the existing icon buttons (rounded, subtle)

### 2. Mobile Menu Changes

Add a "Saved Properties" link at the top of the mobile menu for guests (before the main navigation links):

- Same styling as the logged-in version
- Include badge with count when favorites exist
- Position it prominently so guests can easily find their saves

---

## File Changes

| File | Change |
|------|--------|
| `src/components/layout/Header.tsx` | Add favorites icon for all users (desktop + mobile) |

---

## Technical Notes

- The `useFavorites` hook already returns `favoriteIds` for both guests and authenticated users
- Guest favorites are stored in `sessionStorage` under the key `buywise_guest_favorites`
- The hook already loads guest favorites on mount, so `favoriteCount` will be accurate for guests
- No new components needed — this is a simple addition to the existing Header

---

## Visual Design

**Desktop favorites icon:**
- Same size and style as the user profile icon button
- Heart icon with primary color when there are favorites
- Small badge positioned at top-right showing count

**Mobile menu link:**
- Appears in a highlighted section at the top for guests (similar to how logged-in users see their profile section)
- Includes "Saved to this browser" subtitle to set expectations
