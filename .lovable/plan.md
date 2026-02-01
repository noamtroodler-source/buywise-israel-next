
# CTA Softening & Hero Link Visibility Improvements

## Overview
This plan updates all remaining "Sign Up" / "Sign up free" CTAs to softer, trust-first language and improves the visibility of the "First time?" link in the hero section.

---

## Part 1: Update Remaining CTA Text

### 1.1 GuestSignupNudge.tsx (Default CTA)
**File:** `src/components/shared/GuestSignupNudge.tsx`

**Change:** Update the default `ctaText` prop from `'Sign up free'` to `'Create free account'`

```tsx
// Line 22
ctaText = 'Create free account',
```

This automatically updates all usages that rely on the default, including:
- PropertyQuestionsToAsk.tsx (currently passes `ctaText="Sign up free"`)
- ProjectQuestionsToAsk.tsx (currently passes `ctaText="Sign up free"`)
- Tools.tsx (uses default)

**Also update explicit usages:**
- `src/components/property/PropertyQuestionsToAsk.tsx` line 223: Change `ctaText="Sign up free"` to `ctaText="Create free account"`
- `src/components/project/ProjectQuestionsToAsk.tsx` line 238: Change `ctaText="Sign up free"` to `ctaText="Create free account"`

---

### 1.2 InlineSignupCard.tsx
**File:** `src/components/tools/shared/InlineSignupCard.tsx`

**Change:** Line 42, update CTA text

```tsx
// Before
Sign up free

// After
Create free account
```

---

### 1.3 SaveResultsPrompt.tsx
**File:** `src/components/tools/shared/SaveResultsPrompt.tsx`

**Change:** Line 81, update button text

```tsx
// Before
Sign Up Free

// After
Create Free Account
```

---

### 1.4 Toast Messages in Hooks
**Files:** 
- `src/hooks/useFavorites.tsx` (line 126)
- `src/hooks/useProjectFavorites.tsx` (line 109)

**Change:** Update toast descriptions and action labels

```tsx
// Before
description: 'Saved to this browser only. Sign up free to keep across devices.',
action: { label: 'Sign up', ... }

// After
description: 'Saved to this browser only. Create an account to keep across devices.',
action: { label: 'Create account', ... }
```

---

### 1.5 Tools.tsx GuestSignupNudge Message
**File:** `src/pages/Tools.tsx`

**Change:** Line 316, update message text

```tsx
// Before
message="Sign up free to save your calculations..."

// After  
message="Create a free account to save your calculations..."
```

---

### 1.6 GuestAssumptionsBanner.tsx
**File:** `src/components/shared/GuestAssumptionsBanner.tsx`

**Change:** Lines 110 and 130-131, update link text if any say "sign up"

Looking at the code, the links say "update your profile" and "Set your profile" which are already good - no changes needed here.

---

## Part 2: Improve "First Time?" Link Visibility

### 2.1 HeroSplit.tsx
**File:** `src/components/home/HeroSplit.tsx`

**Current:** The "First time?" link is inside the search form box with `text-white/70` (low contrast) and appears inside the white search box where it becomes invisible.

**Problem:** The text currently renders inside the white `bg-background` form container, making "text-white/70" invisible on a white background!

**Fix:** Move the link outside the form OR change the styling to work within the white box:

```tsx
{/* First time? Entry point - moved outside form OR styled for white background */}
<p className="text-xs sm:text-sm text-muted-foreground text-center mt-3">
  First time buying in Israel?{' '}
  <Link 
    to="/guides/buying-in-israel" 
    className="text-primary font-medium hover:underline underline-offset-2"
  >
    Start with our guide →
  </Link>
</p>
```

**Changes:**
1. Use `text-muted-foreground` instead of `text-white/70` (works on white background)
2. Make the link `text-primary` for better visibility
3. Add `font-medium` for emphasis
4. Add `→` arrow for better visual affordance
5. Change from `text-sm` to `text-xs sm:text-sm` for better mobile sizing

---

## Summary of Files Modified

| File | Change |
|------|--------|
| `src/components/shared/GuestSignupNudge.tsx` | Default ctaText: 'Sign up free' → 'Create free account' |
| `src/components/tools/shared/InlineSignupCard.tsx` | Link text: 'Sign up free' → 'Create free account' |
| `src/components/tools/shared/SaveResultsPrompt.tsx` | Button text: 'Sign Up Free' → 'Create Free Account' |
| `src/components/property/PropertyQuestionsToAsk.tsx` | ctaText prop: 'Sign up free' → 'Create free account' |
| `src/components/project/ProjectQuestionsToAsk.tsx` | ctaText prop: 'Sign up free' → 'Create free account' |
| `src/hooks/useFavorites.tsx` | Toast: 'Sign up free' → 'Create an account' |
| `src/hooks/useProjectFavorites.tsx` | Toast: 'Sign up free' → 'Create an account' |
| `src/pages/Tools.tsx` | Message: 'Sign up free' → 'Create a free account' |
| `src/components/home/HeroSplit.tsx` | Fix "First time?" link styling for visibility |

---

## Technical Notes

### Consistent Language
All buyer/renter-facing CTAs will now use:
- **Primary buttons:** "Create Free Account"
- **Inline links:** "Create free account" or "Create an account"
- **Never:** "Sign up", "Sign Up", "Register" (except for professional registration which is different)

### Professional CTAs (Not Changed)
The following files use "Register as Agent/Agency/Developer" which is appropriate for B2B professional registration:
- `src/components/advertise/AdvertiseCTA.tsx`
- `src/components/advertise/ProfessionalTypeChooser.tsx`

These remain unchanged as they target a different audience (professionals, not buyers/renters).

---

## Implementation Order

1. Update `GuestSignupNudge.tsx` default (cascades to many usages)
2. Update explicit `ctaText` prop usages in PropertyQuestionsToAsk and ProjectQuestionsToAsk
3. Update `InlineSignupCard.tsx`
4. Update `SaveResultsPrompt.tsx`
5. Update toast hooks (`useFavorites.tsx`, `useProjectFavorites.tsx`)
6. Update `Tools.tsx` message
7. Fix `HeroSplit.tsx` "First time?" link visibility
