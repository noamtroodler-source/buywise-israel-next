
# Guest Session Storage Implementation Plan

## Overview

This plan implements **session-based persistence** for guest users, allowing them to:
1. **Save favorite properties** without signing up (cleared when browser closes)
2. **Keep calculator inputs, recent views, and comparisons** during their session

The key change is switching from `localStorage` to `sessionStorage` for guest data. This means data persists while the browser is open (including refreshes and navigating between pages) but is automatically cleared when the browser is closed.

---

## What Changes

| Feature | Current Behavior | New Behavior |
|---------|-----------------|--------------|
| **Favorites** | Requires login | Guests can favorite; persists in session only |
| **Recently Viewed** | localStorage (survives browser close) | sessionStorage (lost on browser close) |
| **Calculator Inputs** | localStorage (7 day expiry) | sessionStorage (lost on browser close) |
| **Compare** | localStorage | sessionStorage (lost on browser close) |
| **Preferences** | localStorage | **No change** (keep across sessions) |
| **Search History** | localStorage | sessionStorage (lost on browser close) |

---

## Part 1: Session Storage Utility

Create a new utility file `src/utils/sessionStorage.ts` with safe wrapper functions for `sessionStorage`, mirroring the existing `safeStorage.ts` pattern.

```text
┌─────────────────────────────────┐
│   src/utils/sessionStorage.ts   │
├─────────────────────────────────┤
│ • safeSessionGet<T>()           │
│ • safeSessionSet()              │
│ • safeSessionRemove()           │
└─────────────────────────────────┘
```

---

## Part 2: Guest Favorites

### 2.1 Update `useFavorites.tsx`

Add hybrid storage like `useRecentlyViewed` already has:

**For guests:**
- Store favorite property IDs in `sessionStorage` key: `buywise_guest_favorites`
- Fetch property details from database on demand
- Show appropriate toast messages

**For logged-in users:**
- No change - continue using database

**Key changes:**
- Add `guestFavoriteIds` state managed via `sessionStorage`
- Modify `toggleFavorite` to work for guests
- Merge guest favorites into the hook's return values
- Remove the login redirect from `FavoriteButton` - let the hook handle it

### 2.2 Update `FavoriteButton.tsx`

Remove the login redirect - guests can now favorite:

```tsx
// Before (lines 24-27):
if (!user) {
  navigate('/auth?redirect=' + ...);
  return;
}

// After:
// No redirect - just call toggleFavorite
toggleFavorite(propertyId, propertyPrice);
```

### 2.3 Update `useProjectFavorites.tsx`

Same pattern - add guest support with `sessionStorage`.

### 2.4 Update `ProjectFavoriteButton.tsx`

Remove login redirect - let guests favorite projects too.

---

## Part 3: Recently Viewed (Switch to Session)

### 3.1 Update `useRecentlyViewed.tsx`

Change from `localStorage` to `sessionStorage`:

```tsx
// Before (lines 16-22):
function getLocalStorage(): RecentlyViewedItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  ...
}

// After:
function getSessionStorage(): RecentlyViewedItem[] {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  ...
}
```

Same changes for `setLocalStorage` → `setSessionStorage`.

### 3.2 Update `useRecentlyViewedProjects.tsx`

Same pattern - switch to `sessionStorage`.

---

## Part 4: Calculator Session Persistence

Update all calculators to use `sessionStorage` instead of `localStorage`:

| Calculator | Storage Key | Changes |
|------------|-------------|---------|
| MortgageCalculator | `mortgage-calculator-saved` | localStorage → sessionStorage |
| AffordabilityCalculator | `affordability-calculator-inputs` | localStorage → sessionStorage |
| PurchaseTaxCalculator | `purchase-tax-calculator-inputs` | localStorage → sessionStorage |
| TrueCostCalculator | `true-cost-calculator-inputs` | localStorage → sessionStorage |
| InvestmentReturnCalculator | `investment-calculator-saved` | localStorage → sessionStorage |
| RentVsBuyCalculator | `rent-vs-buy-calculator-inputs` | localStorage → sessionStorage |
| RenovationCostEstimator | (none currently) | No change needed |
| DocumentChecklistTool | `document-checklist-state` | localStorage → sessionStorage |

**Approach:** Find/replace `localStorage` with `sessionStorage` in each file, and remove the 7-day expiry logic since session data is inherently temporary.

---

## Part 5: Compare Context

Update `src/contexts/CompareContext.tsx` to use `sessionStorage`:

```tsx
// Before (line 19):
const STORAGE_KEY = 'property-compare';
// Uses localStorage.getItem/setItem

// After:
// Uses sessionStorage.getItem/setItem
```

---

## Part 6: Search History

Update `src/components/home/CitySearchInput.tsx` to use `sessionStorage`:

```tsx
// Change localStorage calls to sessionStorage
```

---

## Part 7: Keep Preferences Persistent

**No changes** to `PreferencesContext.tsx` - user preferences (currency, units) should persist across browser sessions since they represent user settings, not temporary activity.

---

## Part 8: Guest Indicator (Optional Enhancement)

Add a subtle indicator when guests have session favorites, prompting them to sign up to save permanently:

```text
┌────────────────────────────────────────────┐
│ 💡 You have 3 saved properties             │
│ Sign up to keep them across devices →      │
└────────────────────────────────────────────┘
```

This could appear on the Favorites page or as a floating prompt similar to `SaveResultsPrompt.tsx`.

---

## Files to Modify

| File | Change Type |
|------|-------------|
| `src/utils/sessionStorage.ts` | **New file** - session storage utilities |
| `src/hooks/useFavorites.tsx` | Add guest support with sessionStorage |
| `src/hooks/useProjectFavorites.tsx` | Add guest support with sessionStorage |
| `src/components/property/FavoriteButton.tsx` | Remove login redirect |
| `src/components/project/ProjectFavoriteButton.tsx` | Remove login redirect |
| `src/hooks/useRecentlyViewed.tsx` | localStorage → sessionStorage |
| `src/hooks/useRecentlyViewedProjects.tsx` | localStorage → sessionStorage |
| `src/components/tools/MortgageCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/AffordabilityCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/PurchaseTaxCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/TrueCostCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/InvestmentReturnCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/RentVsBuyCalculator.tsx` | localStorage → sessionStorage |
| `src/components/tools/DocumentChecklistTool.tsx` | localStorage → sessionStorage |
| `src/contexts/CompareContext.tsx` | localStorage → sessionStorage |
| `src/components/home/CitySearchInput.tsx` | localStorage → sessionStorage |
| `src/pages/Favorites.tsx` | Handle guest favorites display |

---

## User Experience Summary

### Before (Current)
- Guest clicks heart → Redirected to login
- Guest views properties → Saved even after closing browser
- Guest uses calculator → Inputs persist for 7 days

### After (New)
- Guest clicks heart → Property saved immediately (session only)
- Guest views properties → Cleared when browser closes
- Guest uses calculator → Inputs persist until browser closes
- Signed-in users → No change, everything persists in database

---

## Technical Notes

- `sessionStorage` persists across page refreshes and navigation within the same tab
- Each browser tab has its own sessionStorage (unlike localStorage which is shared)
- Data is automatically cleared when the tab/browser is closed
- No expiry logic needed since the browser handles cleanup

---

## Migration Consideration

Existing localStorage data for guests will be orphaned (not deleted, but not read). This is acceptable since:
1. Guest data isn't critical/permanent
2. Users would expect a "fresh start" with this new behavior
3. Logged-in user data remains in the database
