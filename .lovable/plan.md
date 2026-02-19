
# Three Coordinated Improvements to Onboarding & Pricing Clarity

## What You Asked For

1. **Pricing visible from /advertise** — visitors should never wonder what things cost
2. **Dashboard "no plan" prompt** — if `sub.status === 'none'`, show a sticky banner before the quota walls hit silently
3. **"While you wait" plan teaser** — inside the submitted dialogs that appear right after registration, show a plan preview so approval-pending users can familiarise themselves with pricing

The approach follows what best-in-class SaaS platforms do (Notion, Linear, Canva): pricing is public and prominent at every marketing touchpoint; the dashboard activation moment is celebrated and guided, not silent; and the waiting period is used productively to reduce surprise at the billing page.

---

## Change 1 — /advertise: Pricing Link Strip

**File:** `src/components/advertise/AdvertisePlatformStats.tsx`

Right after the platform stats strip (which sits at the top of the page beneath the hero), add a slim "transparent pricing" nudge row — a single line with a `→ View Plans & Pricing` link. This is the least intrusive placement and catches every visitor who scrolls past the hero.

Also update `AdvertiseCTA.tsx` (the bottom blue CTA block) — the "View Plans & Pricing" button already exists there. Make it visually first in the button row instead of last, and change the ghost styling to a proper secondary button so it reads as a primary action alongside Register. Currently it is the *last* button and styled as the dimmest option; flip that.

**Also:** Update `AdvertiseHowItWorks.tsx` Step 02 ("Get Verified") — currently says nothing about pricing. Insert a one-liner under the step description: "Pick a plan before or after approval — no credit card required until you're ready." This sets the expectation that pricing comes *before* the wall hits.

---

## Change 2 — Dashboard: "No Plan" Activation Banner

A new reusable component `src/components/billing/NoPlanBanner.tsx`.

It renders only when `sub.status === 'none'` and shows:

```text
┌─────────────────────────────────────────────────────────────┐
│  🚀  Your account is approved — activate your plan to start │
│      posting listings and getting leads.                    │
│                                                             │
│  [View Plans & Pricing →]   [Maybe Later ×]                 │
└─────────────────────────────────────────────────────────────┘
```

- Styled as a warm gradient banner (primary/5 to amber/5 gradient border) — noticeable but not a red error
- A small dismiss button (`localStorage` key so it only shows once per session — if dismissed, it stays hidden until next login)
- "View Plans" links to `/pricing`
- Placed above `SubscriptionStatusCard` on both `AgencyDashboard` and `DeveloperDashboard`

**Files touched:**
- `src/components/billing/NoPlanBanner.tsx` (new)
- `src/pages/agency/AgencyDashboard.tsx` (insert `<NoPlanBanner entityType="agency" />`)
- `src/pages/developer/DeveloperDashboard.tsx` (insert `<NoPlanBanner entityType="developer" />`)

---

## Change 3 — Submitted Dialogs: "While You Wait" Plan Teaser

The three submitted dialogs (`AgencySubmittedDialog`, `DeveloperSubmittedDialog`, `ApplicationSubmittedDialog`) currently show two info rows (Review in Progress, Email Notification) and a single "Got it" button. They close and dump the user on an empty dashboard with no direction.

Add a third block inside each dialog — below the two existing rows, above the button:

```text
┌──────────────────────────────────────────────────────────┐
│  📋  While you wait — explore pricing                    │
│      Plans start at ₪XX/mo. Pick yours before you're    │
│      approved and hit the ground running on day one.    │
│                                                          │
│  [Explore Plans →]  (opens /pricing in new tab)         │
└──────────────────────────────────────────────────────────┘
```

- Styled exactly like the existing `bg-muted/50 rounded-xl border border-border/50` rows so it fits the design system without new components
- The button opens `/pricing` in a new tab so the user doesn't lose the dialog
- "Got it" button remains the primary close action and navigates to the dashboard as before

**Files touched:**
- `src/components/agency/AgencySubmittedDialog.tsx`
- `src/components/developer/DeveloperSubmittedDialog.tsx`
- `src/components/agent/ApplicationSubmittedDialog.tsx`

---

## Summary Table

| # | Change | Files | Type |
|---|--------|-------|------|
| 1a | Pricing link nudge on /advertise stats strip | `AdvertisePlatformStats.tsx` | Edit |
| 1b | Promote "View Plans" button in CTA block | `AdvertiseCTA.tsx` | Edit |
| 1c | Add pricing note to How It Works step 2 | `AdvertiseHowItWorks.tsx` | Edit |
| 2 | NoPlanBanner component | `NoPlanBanner.tsx` | New |
| 2 | Mount NoPlanBanner on Agency dashboard | `AgencyDashboard.tsx` | Edit |
| 2 | Mount NoPlanBanner on Developer dashboard | `DeveloperDashboard.tsx` | Edit |
| 3a | "While you wait" plan teaser | `AgencySubmittedDialog.tsx` | Edit |
| 3b | Same for developer | `DeveloperSubmittedDialog.tsx` | Edit |
| 3c | Same for agent | `ApplicationSubmittedDialog.tsx` | Edit |

No DB changes. No new routes. No new hooks.
