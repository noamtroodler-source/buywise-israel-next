

## Google OAuth User Onboarding - Implementation Plan

### The Problem

When users sign up via Google, they're authenticated but skip the profile onboarding flow entirely:

```text
Email Signup:
[Sign Up Form] → [justSignedUp = true] → [Buyer Onboarding Wizard] → [Home]

Google OAuth:
[Google Button] → [Redirect to Google] → [Return to /auth with session] → [Home] ❌
                                                                          └── Onboarding SKIPPED!
```

### Root Cause

The `justSignedUp` state is only set in the email/password `handleSubmit` function, but Google OAuth users return already authenticated without triggering this flag.

---

## The Solution

Detect first-time Google OAuth users by checking if:
1. User is authenticated
2. No `buyer_profiles` record exists (for buyers)
3. The user just logged in (first load of Auth page)

### Implementation Approach

**Option A: Check for new users on Auth page return (Recommended)**

When the Auth page loads with an authenticated user who has no buyer profile, show onboarding. This works regardless of whether they signed up via email or Google.

---

## Implementation Details

### 1. Update Auth.tsx - Detect Google OAuth New Users

**Current Logic (problematic):**
```typescript
// Only shows onboarding if justSignedUp === true
if (justSignedUp && !buyerProfile && !isProfessionalSignup) {
  setShowOnboarding(true);
}
```

**New Logic:**
```typescript
// Detect if this is a new user (no buyer profile) who just authenticated
// Works for both email signup AND Google OAuth
const isNewUser = user && !buyerProfile && !profileLoading;
const isOAuthReturn = searchParams.has('code') || searchParams.has('access_token');

useEffect(() => {
  if (isNewUser && !isProfessionalSignup) {
    setShowOnboarding(true);
  }
}, [isNewUser, isProfessionalSignup]);
```

### 2. Files to Modify

| File | Change |
|------|--------|
| `src/pages/Auth.tsx` | Update user detection logic to handle Google OAuth returns |

### 3. Edge Cases to Handle

- **Returning users who login via Google**: They already have a buyer profile, so no onboarding
- **Professional signups via Google**: Redirect to registration wizard (already works)
- **Users who skip onboarding**: Profile page still shows "Set Up Buyer Profile" button

---

## On Password Creation for Google Users

### Best Practice: No Separate Password Required

When users sign up via Google OAuth, they authenticate through Google - no separate password is needed or recommended.

**Why NOT to add password creation:**

| Issue | Explanation |
|-------|-------------|
| Security risk | Users may set weak passwords, undermining Google's 2FA |
| Confusion | "Which password do I use?" |
| Account sync | If they update one, does the other change? |
| Support burden | More password reset requests |

**What happens if a Google user wants email login later?**
They can use "Forgot Password" which will:
1. Verify their email (same as Google)
2. Let them create a password
3. Link both methods to the same account

This is the industry standard (Stripe, Notion, Figma all do this).

---

## Summary

| Task | Complexity |
|------|------------|
| Detect Google OAuth new users | Low |
| Show onboarding wizard for all new buyers | Already exists |
| Password creation | Not needed (industry best practice) |

**Single file change needed**: `src/pages/Auth.tsx` - update the user detection logic to trigger onboarding for users without a buyer profile, regardless of how they authenticated.

