

# Fix Core Locations Not Saving During Onboarding

## Problem Identified

When a new user signs up and adds a core location during the onboarding wizard (e.g., "Hanadi Fourteen Street"), the location is **not saved to the database**. The user arrives at their profile page and sees "None added" with an "Add Your First Location" button.

### Root Cause

The `useCreateBuyerProfile` hook in `src/hooks/useBuyerProfile.tsx` **explicitly lists each field** to insert but **omits two important fields**:

1. `saved_locations` - Core locations added during onboarding
2. `mortgage_preferences` - Mortgage settings from onboarding

**Lines 86-100 (current broken code):**
```typescript
const { data, error } = await supabase
  .from('buyer_profiles')
  .insert({
    user_id: user.id,
    residency_status: profileData.residency_status || 'israeli_resident',
    aliyah_year: profileData.aliyah_year || null,
    is_first_property: profileData.is_first_property ?? true,
    purchase_purpose: profileData.purchase_purpose || 'primary_residence',
    buyer_entity: profileData.buyer_entity || 'individual',
    onboarding_completed: profileData.onboarding_completed ?? true,
    has_existing_property: profileData.has_existing_property ?? false,
    is_upgrading: profileData.is_upgrading ?? false,
    upgrade_sale_date: profileData.upgrade_sale_date || null,
    arnona_discount_categories: profileData.arnona_discount_categories || [],
    // MISSING: saved_locations and mortgage_preferences!
  })
```

Meanwhile, the `BuyerOnboarding.tsx` component correctly prepares these fields (lines 165-177):
```typescript
const savedLocations = onboardingLocations.map(loc => ({...}));
const profileData = {
  ...answers,
  onboarding_completed: true,
  mortgage_preferences: mortgagePreferences,
  ...(savedLocations.length > 0 && { saved_locations: savedLocations }),
};
await createProfile.mutateAsync(profileData);
```

The data is prepared correctly but **dropped silently** because `useCreateBuyerProfile` doesn't include those fields in the insert.

### Database Evidence

I queried the `buyer_profiles` table and found the user's profile created at `2026-01-26 19:13:32` has:
```json
{ "saved_locations": [] }
```

This confirms the locations were never saved.

---

## The Fix

Add the missing `saved_locations` and `mortgage_preferences` fields to the insert statement in `useCreateBuyerProfile`.

### File: `src/hooks/useBuyerProfile.tsx`

**Lines 86-100 - Add two missing fields:**

```typescript
const { data, error } = await supabase
  .from('buyer_profiles')
  .insert({
    user_id: user.id,
    residency_status: profileData.residency_status || 'israeli_resident',
    aliyah_year: profileData.aliyah_year || null,
    is_first_property: profileData.is_first_property ?? true,
    purchase_purpose: profileData.purchase_purpose || 'primary_residence',
    buyer_entity: profileData.buyer_entity || 'individual',
    onboarding_completed: profileData.onboarding_completed ?? true,
    has_existing_property: profileData.has_existing_property ?? false,
    is_upgrading: profileData.is_upgrading ?? false,
    upgrade_sale_date: profileData.upgrade_sale_date || null,
    arnona_discount_categories: profileData.arnona_discount_categories || [],
    // ADD THESE TWO LINES:
    saved_locations: profileData.saved_locations || [],
    mortgage_preferences: profileData.mortgage_preferences || null,
  })
```

---

## Summary

| File | Change |
|------|--------|
| `src/hooks/useBuyerProfile.tsx` | Add `saved_locations` and `mortgage_preferences` to the insert object (lines 99-100) |

## Result After Fix

- Core locations added during onboarding will be saved to the database
- The profile page will show the user's saved locations immediately
- Mortgage preferences will also persist correctly for new users
- The fix ensures new users don't lose any data they entered during signup

