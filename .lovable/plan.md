
# Persist User Preferences to Account

## Overview
This plan adds account-based preference persistence so logged-in users' currency and area unit choices are saved to their profile and follow them across devices.

---

## Current Behavior
- **Default**: USD + sqft (already implemented)
- **Anonymous users**: Preferences saved in browser localStorage
- **Logged-in users**: Same as anonymous (localStorage only)

## New Behavior
- **Default**: USD + sqft (no change)
- **Anonymous users**: Continue using localStorage
- **Logged-in users**: Preferences sync to database AND localStorage as backup

---

## Changes Summary

### 1. Database Migration
Add two columns to the `profiles` table:
- `preferred_currency`: Stores 'ILS' or 'USD'
- `preferred_area_unit`: Stores 'sqm' or 'sqft'

### 2. Update PreferencesContext
Modify the context to:
1. Check if user is logged in (via useAuth)
2. If logged in: load preferences from database profile
3. If anonymous: load from localStorage (current behavior)
4. When preferences change for logged-in user: save to database

---

## Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `preferred_currency` and `preferred_area_unit` columns to `profiles` |
| `src/types/database.ts` | Add the new fields to the Profile interface |
| `src/contexts/PreferencesContext.tsx` | Integrate auth state and database sync |

---

## Technical Details

### Database Migration
```sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS preferred_area_unit text DEFAULT NULL;
```

- `NULL` means "use site default" (USD/sqft)
- Only stores user's explicit choice

### Profile Type Update
```typescript
export interface Profile {
  // ... existing fields ...
  preferred_currency: 'ILS' | 'USD' | null;
  preferred_area_unit: 'sqm' | 'sqft' | null;
}
```

### PreferencesContext Changes

**Add user state integration:**
```typescript
import { useAuth } from '@/hooks/useAuth';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
```

**Load from profile when logged in:**
```typescript
// If user is logged in and has profile preferences, use those
useEffect(() => {
  if (profile?.preferred_currency) {
    setCurrencyState(profile.preferred_currency);
  }
  if (profile?.preferred_area_unit) {
    setAreaUnitState(profile.preferred_area_unit);
  }
}, [profile]);
```

**Save to profile on change:**
```typescript
const setCurrency = (c: Currency) => {
  setCurrencyState(c);
  if (user) {
    updateProfile.mutate({ preferred_currency: c });
  }
};
```

---

## User Experience Flow

### New Visitor (Anonymous)
1. Sees USD + sqft by default
2. Can change preferences via toggle
3. Changes saved to localStorage
4. Returns to site → same preferences (from localStorage)

### User Signs Up
1. Profile created with `preferred_currency: NULL`, `preferred_area_unit: NULL`
2. Current localStorage preferences are synced to profile
3. Future changes save to both database AND localStorage

### User Logs In (Existing Account)
1. If profile has saved preferences → use those
2. If profile preferences are NULL → use localStorage or defaults
3. Preferences follow them across devices

### User Logs Out
1. Local preferences remain in localStorage
2. Next time they log in, their account preferences are restored

---

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| First visit, no localStorage | USD + sqft (defaults) |
| Has localStorage, not logged in | Use localStorage |
| Logged in, profile has preferences | Use profile preferences |
| Logged in, profile preferences NULL | Use localStorage, then defaults |
| Changes preference while logged in | Saves to profile + localStorage |
| Changes preference while logged out | Saves to localStorage only |
