
# Founding Program — Full Benefit Surfacing Plan

## The Gaps

### Gap 1 — `FoundingProgramSection` is incomplete
The section on `/pricing` has 3 cards but omits the **case study opportunity** entirely, and the "Monthly Credits" card is a single vague sentence. The DB `credit_schedule` is `[150, 150, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]` — which means months 1–2 get 150 credits, months 3–12 get 50 credits. This is genuinely compelling (₪2,000–₪3,000 of free visibility value) and needs to be made specific and visual.

### Gap 2 — Pricing page banner is a single pill line
The top-of-page banner (`inline-flex items-center gap-2 px-4 py-2 rounded-full`) compresses the entire offer into one line: "Use code FOUNDING2026 for 60-day free trial + 25% off for 10 months". The credit schedule and case study opportunity are invisible. A user who reads this banner and moves on misses the most compelling part of the offer.

### Gap 3 — No post-redemption Founding Member experience
Once someone has redeemed FOUNDING2026 and is on a trial, none of the billing UI surfaces:
- That they are a **Founding Member** (special status)
- Their **credit grant timeline** (when credits arrive, how many)
- The **case study opportunity** (a unique benefit that has zero UI)

The `TrialCountdownBanner` only shows "X days left in your free trial" with a progress bar. The `BillingSection` shows nothing about founding member status. A user who's already in has no visibility into what's coming.

---

## What the DB Tells Us

The FOUNDING2026 promo code in the database has:
- `trial_days: 60`
- `discount_percent: 25`, `discount_duration_months: 10`
- `credit_schedule: [150, 150, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50]`

Month 1–2: 150 credits each = 300 credits free
Month 3–12: 50 credits each = 500 credits free
Total free credits over 12 months: **800 credits** (worth ~₪16,000 at ₪20/credit)

This is a powerful offer that the current UI completely undersells.

---

## What We're Building

### Fix 1 — Expand `FoundingProgramSection` with 4 benefit cards + credit timeline

Replace the current 3-card grid with 4 benefit cards (adding "Case Study Feature"), then add a visual credit timeline row below.

**4 benefit cards:**
1. **60-Day Free Trial** — "Try any plan completely risk-free. No charge for 60 days, cancel anytime."
2. **25% Off for 10 Months** — "After your trial, save 25% on your plan for the next 10 months."
3. **Priority Credits** — "Receive 150 visibility credits/month for your first 2 months, then 50/month for 10 months. ~₪16,000 in free platform value."
4. **Case Study Feature** — "Get featured on our blog and social channels as a launch partner — free exposure to our buyer and investor audience."

**Credit timeline visualization** — a horizontal timeline showing month labels (Trial M1, Trial M2, Month 1–10) with credit amounts below each, styled with the primary color. This makes the `credit_schedule` array tangible and real.

**File:** `src/components/billing/FoundingProgramSection.tsx`

---

### Fix 2 — Upgrade the Pricing page hero banner from a pill to a feature callout

Replace the single `inline-flex` pill banner in `src/pages/Pricing.tsx` with a slightly wider card banner (max-w-2xl, rounded-2xl) that shows:
- "Founding Program — Limited Time" heading with Sparkles icon
- 3 quick bullets: trial / discount / credits
- The code in a copyable mono chip
- A "Learn more ↓" anchor link to `#founding` (the `FoundingProgramSection` below)

The `FoundingProgramSection` gets an `id="founding"` added so the scroll link works.

**File:** `src/pages/Pricing.tsx`

---

### Fix 3 — `FoundingMemberBanner`: post-redemption awareness in billing hubs

Create a new component `src/components/billing/FoundingMemberBanner.tsx`.

It reads `useSubscription()` data. It renders when:
- `sub.status === 'trialing'` AND the subscription was created with the FOUNDING2026 promo

To detect FOUNDING2026 redemption without adding a DB query: query `subscription_promo_redemptions` joined to `promo_codes` for `code = 'FOUNDING2026'` where `subscription_id = sub.id`. If found, the user is a Founding Member.

The banner shows:
- **Gold/amber gradient** to differentiate it from the plain `TrialCountdownBanner` (which stays for its progress bar function)
- "You're a Founding Member" heading with a Star/Award icon
- 3 inline chips: "60-day trial", "25% off for 10 months", "Up to 800 free credits"
- A credit schedule summary: "150 credits/mo for months 1–2, then 50 credits/mo for 10 months"
- "Case Study Opportunity" — "As a Founding Member you'll be invited to share your growth story with our audience."
- A dismissible state (localStorage key `founding_banner_dismissed_{sub.id}`)

The banner is added to `AgencyBilling.tsx` and `DeveloperBilling.tsx` above `TrialCountdownBanner`.

**Files:**
- `src/components/billing/FoundingMemberBanner.tsx` (new)
- `src/pages/agency/AgencyBilling.tsx` (add import + component)
- `src/pages/developer/DeveloperBilling.tsx` (add import + component)

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/components/billing/FoundingProgramSection.tsx` | Edit | 4-card layout with Case Study card; credit timeline visualization; `id="founding"` for anchor linking |
| `src/pages/Pricing.tsx` | Edit | Replace pill banner with feature callout card; add anchor link to `#founding` |
| `src/components/billing/FoundingMemberBanner.tsx` | New | Post-redemption Founding Member banner with credit schedule and case study callout |
| `src/pages/agency/AgencyBilling.tsx` | Edit | Add `FoundingMemberBanner` above `TrialCountdownBanner` |
| `src/pages/developer/DeveloperBilling.tsx` | Edit | Add `FoundingMemberBanner` above `TrialCountdownBanner` |

---

## Technical Notes

- **No DB migration needed.** The promo code is already seeded. The `subscription_promo_redemptions` table already tracks which subscriptions used FOUNDING2026.
- **Founding Member detection:** `FoundingMemberBanner` queries `subscription_promo_redemptions` joined to `promo_codes` filtered by `code = 'FOUNDING2026'` and `subscription_id = sub.id`. This is a single lightweight query; result is cached via `useQuery` with a 10-minute stale time. If the user has no redemption row, the banner is invisible.
- **Dismissal:** Uses `localStorage` keyed to `sub.id` — so dismissing on one device persists per-device, and each new subscription gets a fresh banner. No DB write needed.
- **Credit timeline in `FoundingProgramSection`** is hardcoded from the known `credit_schedule` array — it does not need to query the DB since the schedule is fixed for the Founding Program.
- **The existing `TrialCountdownBanner`** is NOT removed — it provides the progress bar. The `FoundingMemberBanner` stacks above it and explains the full benefit set.
- **The "Case Study Opportunity"** is presented as informational text only — no form or workflow is built. A follow-up task can add a "Register Interest" button that sends an email to the admin.
- **`FoundingProgramSection` changes are public-facing** (visible to all `/pricing` visitors, logged in or not). The `FoundingMemberBanner` is only shown to authenticated users who have redeemed the code.
