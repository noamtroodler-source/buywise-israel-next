
# Consolidate /advertise + /pricing into One Best-In-Class Page

## The Core Problem You Identified

Right now there's a logic gap that creates friction:
- `/advertise` persuades you to sign up, but hides the price
- `/pricing` shows you the price, but only makes sense if you already have an account
- A visitor who clicks "Register as Agency" and then discovers the pricing after approval feels ambushed

The right answer: **one unified `/advertise` page** that handles the full visitor journey — who you are, why join, how it works, what it costs, and how to start. The `/pricing` route then becomes an internal-only page (for logged-in users managing their subscription), which it should have been all along.

---

## What Gets Removed

- `FeatureComparisonTable` — gone (you said so, and it's overkill for 3 differentiating fields)
- `FoundingProgramSection` / `FoundingPromoRibbon` / `FoundingProgramModal` — not shown on the public page (handled via promo code post-signup)
- Credit packages section — internal only, not public-facing
- The separate `/pricing` page as a marketing destination (kept for logged-in billing management)
- The `NoPlanBanner` link to `/pricing` will stay pointing to `/pricing` which becomes the internal billing UI

---

## New Page Structure: `/advertise`

The page flows like a conversation — top to bottom, each section answers the natural next question in a visitor's mind:

```text
1. HERO          — "Who are you and why should I care?"
2. STATS STRIP   — "Proof this is real"
3. WHY BUYWISE   — "What do I actually get?"
4. HOW IT WORKS  — "What are the steps?" (with pricing woven in at step 2)
5. CHOOSE PATH   — "Which type am I?" (Agent / Agency / Developer)
6. PLANS & PRICING — "What does it cost?" ← NEW inline section
7. TESTIMONIALS  — "Do real people use this?"
8. FAQ           — Merged: join + billing questions in one accordion
9. CTA BANNER    — Final push with register buttons
```

---

## Detailed Changes

### 1. Keep (with minor edits)
- `AdvertiseHero` — hero is strong, keep as-is
- `AdvertisePlatformStats` — trim the pricing nudge strip (no longer needed, pricing is on the same page)
- `AdvertiseValuePillars` — keep as-is
- `AdvertiseHowItWorks` — the step 2 pricing note (added last session) stays
- `ProfessionalTypeChooser` — remove the "Free during founding period · View plans & pricing" sub-note (pricing is now just below)
- `AdvertiseTestimonials` — keep as-is
- `AdvertiseCTA` — keep as the bottom anchor

### 2. New Component: `AdvertisePricingSection`

**File:** `src/components/advertise/AdvertisePricingSection.tsx`

This is the most important new piece. It embeds the full pricing logic directly into the advertise page:

- Agency / Developer tab toggle (same as current `/pricing` page)
- Monthly / Annual billing cycle toggle with "Save 20%" label
- Annual info banner when toggled
- Plan cards pulled live from the database (`membership_plans` table)  
- Trust signals row (30-day guarantee, Stripe, cancel anytime)
- Enterprise CTA at the bottom

**Key behavior for unauthenticated visitors:** When an anonymous visitor clicks "Get Started" / "Subscribe" on a plan card, instead of hitting a checkout error, they are redirected to `/auth?tab=signup&role=agency` (or `developer`) with the plan tier stored in sessionStorage. This means after approval they land on the dashboard already knowing which plan to pick. This is the correct flow — plan selection is an *aspiration* at signup time, not a transactional step.

**What this means for `PlanCard` buttons when user is not logged in:**
- CTA label becomes: `"Get Started — it's free"`
- Click action: navigate to the appropriate signup route for that entity type
- No checkout is triggered for anonymous users

### 3. New Component: `AdvertisePricingSection` — simplified plan display

Since we're dropping the comparison table and the founding program, the pricing section will be clean:

```text
Agency Plans  |  Developer Plans        [Monthly / Annual toggle]

┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Starter  │  │ Growth ★Pop │  │    Pro       │  │  Enterprise  │
│ ₪X/mo   │  │ ₪X/mo       │  │ ₪X/mo       │  │   Custom     │
│ features │  │ features    │  │ features    │  │ Contact Us   │
│ Get Free │  │ Get Started │  │ Get Started │  │   Contact    │
└──────────┘  └──────────────┘  └──────────────┘  └──────────────┘

🔒 SSL · 30-day guarantee · Cancel anytime
```

### 4. Merge FAQs

The `AdvertiseFAQ` (7 join-related questions) and `PricingFAQ` (6 billing questions) are merged into a single comprehensive accordion with section dividers:

- **About Joining** (5 best questions from AdvertiseFAQ)
- **Plans & Billing** (5 best questions from PricingFAQ, removing the Founding Program question)

The merged component replaces both. The `AdvertiseFAQ.tsx` file is updated in-place.

### 5. Update `src/pages/Advertise.tsx`

Replace the current import list with the new section order:

```tsx
<Layout>
  <AdvertiseHero />
  <AdvertisePlatformStats />
  <AdvertiseValuePillars />
  <AdvertiseHowItWorks />
  <ProfessionalTypeChooser />
  <AdvertisePricingSection />   {/* ← NEW */}
  <AdvertiseTestimonials />
  <AdvertiseFAQ />              {/* ← merged FAQs */}
  <AdvertiseCTA />
</Layout>
```

### 6. Update `src/pages/Pricing.tsx`

The `/pricing` route is kept but repurposed as a **logged-in billing management page only**:
- Remove: `FoundingPromoRibbon`, `FoundingProgramModal`, `FoundingProgramSection`
- Remove: `FeatureComparisonTable`
- Remove: Credit Packages section
- Keep: Plan cards with real checkout logic (for authenticated users changing plans)
- Keep: `BillingCycleToggle`, `PromoCodeInput`, trust signals, enterprise CTA, `PricingFAQ`
- Add: A redirect guard — if user is not logged in, redirect to `/advertise#pricing`

### 7. Update `NoPlanBanner`

The banner's "View Plans & Pricing" link now points to `/advertise#pricing` for unauthenticated context, but since users seeing `NoPlanBanner` are already logged in, it stays pointing to `/pricing` (the internal billing page). No change needed here.

### 8. Update `AdvertiseCTA.tsx`

The bottom CTA already has the right structure. Remove the "View Plans & Pricing" button from it (pricing is now visible on the same page — the visitor already scrolled past it). Keep only the three register buttons.

---

## Files Summary

| File | Action | What Changes |
|------|--------|--------------|
| `src/components/advertise/AdvertisePricingSection.tsx` | **Create** | New pricing section with tabs, toggle, plan cards |
| `src/pages/Advertise.tsx` | Edit | Add `AdvertisePricingSection`, reorder sections |
| `src/pages/Pricing.tsx` | Edit | Strip public marketing content, add login guard |
| `src/components/advertise/AdvertiseFAQ.tsx` | Edit | Merge join + billing FAQs, remove founding program Q |
| `src/components/advertise/AdvertiseCTA.tsx` | Edit | Remove "View Plans & Pricing" button (redundant now) |
| `src/components/advertise/ProfessionalTypeChooser.tsx` | Edit | Remove "Free during founding · View pricing" sub-note |
| `src/components/advertise/AdvertisePlatformStats.tsx` | Edit | Remove the slim pricing nudge strip (redundant) |

No DB changes. No new hooks. No new routes. 7 file touches, 1 new file.
