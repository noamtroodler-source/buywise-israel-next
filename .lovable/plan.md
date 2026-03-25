

## Plan: Budget Currency Conversion + Country/Referral in Profile Settings

### Summary
Three changes:
1. **Convert budget to NIS before saving** — if user enters in USD, multiply by exchange rate so `budget_min`/`budget_max` are always stored in ₪
2. **Keep country/referral on `profiles` only** — it's account-level data, not buyer-profile-specific. No sync needed.
3. **Add country + referral source fields to AccountSection** — so Google OAuth users (and anyone) can view/edit them in profile settings

---

### 1. Budget → Always Store in NIS

**File: `src/components/onboarding/BuyerOnboarding.tsx`**

In `handleComplete`, before saving `budget_min`/`budget_max`, convert if `budgetCurrency === 'USD'`:
- Fetch the exchange rate from `PreferencesContext` (already available via `usePreferences()`) or query `calculator_constants` inline
- If USD: `budget_min * exchangeRate`, `budget_max * exchangeRate` → round to nearest integer
- If ILS: save as-is

Since `BuyerOnboarding` may not be wrapped in `PreferencesContext`, we'll fetch the rate directly from Supabase at save time (same pattern as `PreferencesContext` uses). Simple, no new dependencies.

Changes:
- Import `supabase` client
- In `handleComplete`, before building `profileData`, fetch exchange rate and convert if needed
- Fallback to 3.65 if fetch fails

---

### 2. Country/Referral — Stay on `profiles` Only

No code changes needed. The columns on `buyer_profiles` exist but won't be used — they can stay empty. Account-level data belongs on `profiles`, and that's where Auth.tsx already saves it. Clean separation.

---

### 3. Country + Referral Source in AccountSection

**File: `src/components/profile/sections/AccountSection.tsx`**

Add two fields to the display grid and edit form:
- **Country** — dropdown with same `COUNTRY_OPTIONS` list from Auth.tsx (extract to shared constant)
- **How did you hear about us** — dropdown with same `REFERRAL_OPTIONS`

Display: show current values in the read-only grid alongside Full Name, Phone, Member Since
Edit: add two `Select` dropdowns to the edit form

**File: `src/lib/constants/signupOptions.ts`** (new)
- Extract `COUNTRY_OPTIONS` and `REFERRAL_OPTIONS` from Auth.tsx into a shared file
- Import in both Auth.tsx and AccountSection.tsx

---

### Files Changed
| File | Change |
|------|--------|
| `src/lib/constants/signupOptions.ts` | New — shared country/referral option lists |
| `src/pages/Auth.tsx` | Import options from shared file instead of inline |
| `src/components/onboarding/BuyerOnboarding.tsx` | Convert budget USD→NIS before save |
| `src/components/profile/sections/AccountSection.tsx` | Add country + referral fields to view/edit |

No database migrations needed — all columns already exist.

