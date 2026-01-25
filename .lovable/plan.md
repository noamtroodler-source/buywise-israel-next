

# Subtle Signup Nudges Implementation Plan

## Overview

This plan adds strategic, value-focused signup prompts throughout the site that feel helpful rather than pushy. Each nudge will highlight a specific benefit the user gains by creating an account, using subtle, consistent styling.

---

## Design Philosophy

**Principles:**
- **Contextual** — Appear at moments when the user would actually benefit from an account
- **Value-first** — Always lead with what the user gets, not what we want
- **Subtle** — Use muted colors, small text, and gentle animations
- **Non-blocking** — Never interrupt the user's flow; nudges are informational
- **Dismissible** — Where appropriate, users can close/hide nudges

**Visual Style:**
- Muted background (`bg-muted/30` or `bg-primary/5`)
- Small text (`text-xs` or `text-sm`)
- Subtle icons (small, muted color)
- Gentle borders (`border-border/50`)

---

## Nudge Locations & Implementation

### 1. Guest Favorites Toast Enhancement

**Location:** Toast message when guest saves a property

**Current:** "Property saved to favorites"

**Enhanced:** Include a subtle CTA to remind guests their saves are temporary

**Implementation:**
Update `useFavorites.tsx` and `useProjectFavorites.tsx` to show a richer toast for guests:

```text
┌────────────────────────────────────────────────┐
│ ✓ Property saved to favorites                  │
│                                                │
│ 💡 Saved to this browser only.                 │
│    Sign up free to keep across devices →       │
└────────────────────────────────────────────────┘
```

The toast action link navigates to `/auth?tab=signup`.

---

### 2. Tools Page Signup Banner

**Location:** Tools index page (when showing all tools)

**Purpose:** Encourage account creation to save tool results and get personalized defaults

**Design:** Subtle horizontal banner below the header, above the tools grid

```text
┌──────────────────────────────────────────────────────────────────┐
│ 💡 Sign up free to save your calculations and get personalized  │
│    estimates based on your buyer profile.               Sign Up │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation:**
Add a new `ToolsSignupNudge` component shown only to guests in `Tools.tsx`, positioned between the header and the tools grid.

---

### 3. Favorites Page Guest Banner

**Location:** Favorites page (when guest has session favorites)

**Purpose:** Remind guests that their favorites are temporary

**Design:** Info banner at the top of the favorites list

```text
┌──────────────────────────────────────────────────────────────────┐
│ 🔔 These properties are saved to this browser only.             │
│    Create a free account to keep them forever, get price drop   │
│    alerts, and access across devices.               Create Account │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation:**
Add `GuestFavoritesBanner` component to `Favorites.tsx`, shown when `!user && totalFavorites > 0`.

---

### 4. Compare Page Session Warning

**Location:** Compare page (for guests)

**Purpose:** Inform guests their comparison is temporary

**Design:** Small banner below the hero section

```text
┌──────────────────────────────────────────────────────────────────┐
│ 💡 Your comparison is saved to this session only.               │
│    Sign up to save comparisons and revisit them anytime.        │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation:**
Add subtle banner in `Compare.tsx` after the `CompareHero`, shown only for guests.

---

### 5. Cost Breakdown "Personalized Accuracy" Nudge

**Location:** PropertyCostBreakdown and ProjectCostBreakdown (already partially exists)

**Enhancement:** The existing `PersonalizationHeader` already has signup CTAs. We'll enhance the messaging to be more benefit-focused.

**Current:** "Set up profile (free)"

**Enhanced:** "Get accurate estimates for your situation →"

This is a copy tweak in `PersonalizationHeader.tsx` rather than a new component.

---

### 6. Tool Results "Save Permanently" Enhancement

**Location:** Within calculator results area (not the floating SaveResultsPrompt)

**Purpose:** A static, inline nudge that appears in the results column for guests

**Design:** Small card at the bottom of the results section

```text
┌──────────────────────────────────────────────────────────────────┐
│ 📊 Want to save this calculation?                                │
│    Create a free account to save results, compare scenarios,     │
│    and pick up where you left off on any device.                │
│                                               [Sign Up Free]     │
└──────────────────────────────────────────────────────────────────┘
```

**Implementation:**
Create a new `InlineSignupCard` component that can be included in the `bottomSection` or `rightColumn` of calculators. This is more persistent/visible than the dismissible toast-style `SaveResultsPrompt`.

---

### 7. Recently Viewed "Session Only" Note

**Location:** Profile page Recently Viewed section (for guests who somehow access it) OR on property pages in the footer area

**Purpose:** Subtle reminder that browsing history is temporary

This applies less directly since the Profile page requires auth, but we could add a small note to any "You recently viewed" section if we surface one on property detail pages for guests.

**Decision:** Skip for now — lower priority since guests don't see a "recently viewed" section prominently.

---

## Components to Create

### `src/components/shared/GuestSignupNudge.tsx`

A reusable, configurable nudge component:

```tsx
interface GuestSignupNudgeProps {
  icon?: LucideIcon;
  message: string;
  ctaText?: string;
  variant?: 'inline' | 'banner' | 'card';
  className?: string;
}
```

This component:
- Only renders for guests (checks `useAuth().user`)
- Has multiple visual variants (inline subtle text, full-width banner, card)
- Includes dismiss functionality for persistent nudges (optional)
- Links to `/auth?tab=signup`

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/shared/GuestSignupNudge.tsx` | **New** — Reusable nudge component |
| `src/hooks/useFavorites.tsx` | Enhanced toast with signup link for guests |
| `src/hooks/useProjectFavorites.tsx` | Same enhancement |
| `src/pages/Tools.tsx` | Add signup banner for guests |
| `src/pages/Favorites.tsx` | Add guest favorites banner |
| `src/pages/Compare.tsx` | Add session warning for guests |
| `src/components/property/PersonalizationHeader.tsx` | Copy enhancement for CTA text |
| `src/components/tools/shared/InlineSignupCard.tsx` | **New** — Static result-area signup card |

---

## Nudge Summary Table

| Location | Trigger | Message Focus | Style |
|----------|---------|---------------|-------|
| Favorites toast | Guest saves property | "Browser only, sign up to keep" | Toast with action |
| Tools page | Guest views tools list | "Save calculations, get personalized" | Subtle banner |
| Favorites page | Guest has favorites | "Keep forever, price alerts" | Info banner |
| Compare page | Guest comparing | "Session only, save to revisit" | Small note |
| Cost breakdown | Guest views estimates | "Accurate for your situation" | Existing banner (copy tweak) |
| Calculator results | Guest completes calc | "Save and compare scenarios" | Static card |

---

## What We're NOT Doing

- **No popups or modals** — These interrupt the user and feel aggressive
- **No countdown timers or urgency** — Not that kind of marketing
- **No blocking access** — Everything remains fully usable for guests
- **No repetitive messaging** — Each nudge appears in one specific context

---

## Expected Outcome

After implementation:
- Guests will see gentle, contextual reminders about account benefits
- Each nudge appears at a moment when the benefit is relevant
- The site feels helpful, not salesy
- Conversion prompts are present but never interrupt the experience
- All messaging focuses on what the user gains, not what we want

