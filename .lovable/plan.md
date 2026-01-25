
# Fix Project Favorite Hearts to Use Blue Instead of Red

## The Problem

On the Favorites page, the project favorite hearts are showing as **red** (`text-destructive`) instead of **blue** (`text-primary`) like the property and rental favorites.

| Category | Current Color | Expected Color |
|----------|--------------|----------------|
| Properties | ✅ Blue (primary) | Blue (primary) |
| Rentals | ✅ Blue (primary) | Blue (primary) |
| Projects | ❌ Red (destructive) | Blue (primary) |

## Root Cause

The Favorites page (`src/pages/Favorites.tsx`) uses a **hardcoded button** for project favorites instead of the standardized `ProjectFavoriteButton` component. The hardcoded button has `text-destructive` styling.

**Line 368:**
```tsx
className="h-8 w-8 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
```

## The Fix

Update the project favorite button in the Favorites page to use `text-primary` instead of `text-destructive`.

---

## File to Update

| File | Change |
|------|--------|
| `src/pages/Favorites.tsx` | Change `text-destructive` → `text-primary` on line 368 |

---

## Code Change

**Line 368** - Update from:
```tsx
className="h-8 w-8 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
```

To:
```tsx
className="h-8 w-8 bg-background/80 hover:bg-background text-primary hover:text-primary/80"
```

---

## Result

| Before | After |
|--------|-------|
| 🔴 Red heart on project cards | 🔵 Blue heart on project cards |

All favorite hearts across the site will now use consistent blue (`text-primary`) styling, matching the brand color palette standards.
