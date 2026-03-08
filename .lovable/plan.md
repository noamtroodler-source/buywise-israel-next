

# Phase 1: Founding Partner Enrollment + Updated Spec (No PayPlus needed yet)

This phase builds everything that can work today without PayPlus — the founding partner enrollment flow, the 15-agency cap, the 2-month free trial, and 3 free featured credits/month.

---

## What exists now vs. what changes

**DB tables already exist** with the right shape:
- `subscriptions` — already has `trial_start`, `trial_end`, `status` columns
- `founding_partners` — has `agency_id`, `free_credits_per_month`, `free_credits_duration_months`, `is_active`
- `founding_featured_credits` — has monthly credit rows with `credits_granted`, `credits_used`, `expires_at`
- `featured_listings` — has `is_free_credit` flag
- `promo_codes` — FOUNDING2026 exists but has old spec (25% off, 800 credits)

**Missing pieces:**
- `subscriptions` needs `is_founding_partner` boolean and `payplus_customer_id` / `payplus_subscription_id` text columns
- `featured_listings` needs `payplus_subscription_id` text column (for later)
- No `enroll-founding-partner` edge function exists
- No 15-cap enforcement anywhere
- No live "spots remaining" counter on frontend
- FoundingProgramSection and FoundingProgramModal show old benefits (25% off, 800 credits)
- Pricing page calls `stripe-checkout` — needs to also handle founding enrollment path

---

## Step 1: DB Migration

Add to `subscriptions`:
- `is_founding_partner BOOLEAN DEFAULT false`
- `payplus_customer_id TEXT`
- `payplus_subscription_id TEXT`

Add to `featured_listings`:
- `payplus_subscription_id TEXT`

Update FOUNDING2026 promo code data:
- Set `max_redemptions = 15`
- Clear `discount_percent` → 0, `discount_duration_months` → 0
- Clear `credit_schedule` → null
- Keep `trial_days = 60`

## Step 2: `enroll-founding-partner` Edge Function

Accepts: `{ plan_id, billing_cycle }` from authenticated user.

Logic:
1. Verify user is authenticated, get their agency via `agents` → `agency_id`
2. Check `SELECT COUNT(*) FROM founding_partners WHERE is_active = true` < 15
3. Check agency isn't already enrolled
4. Insert into `founding_partners` with `free_credits_per_month = 3`, `free_credits_duration_months = 2`
5. Insert/upsert into `subscriptions` with `status = 'trialing'`, `trial_start = now()`, `trial_end = now() + 60 days`, `is_founding_partner = true`, selected `plan_id` and `billing_cycle`
6. Grant first month's 3 credits into `founding_featured_credits`
7. Record promo redemption in `subscription_promo_redemptions`
8. Increment `times_redeemed` on promo code
9. Return `{ success: true, trial_end, spots_remaining }`

## Step 3: Spots Counter Query Hook

New hook `useFoundingSpotsRemaining()`:
- Queries `SELECT COUNT(*) FROM founding_partners WHERE is_active = true`
- Returns `{ enrolled, remaining: 15 - enrolled }`

## Step 4: Update FoundingProgramSection

Replace old benefits with updated spec:
- "First 2 months completely free on any plan"
- "3 free featured listings per month during trial"
- "Exclusive early access — your listings go live before anyone else's"
- "Featured case study on launch"

Remove the credit timeline visualization (no longer relevant). Add live spots counter badge ("X of 15 spots remaining").

## Step 5: Update FoundingProgramModal

Same benefit copy updates. Add spots counter. "Activate Now" button calls `enroll-founding-partner` instead of just storing a promo code.

## Step 6: Update Pricing Page Flow

When user enters FOUNDING2026 promo code:
- Validate it server-side (check spots remaining)
- Change CTA on plan cards from "Subscribe" to "Activate Founding Program"
- On click: call `enroll-founding-partner` instead of `stripe-checkout`
- On success: redirect to `/checkout/success` with founding-specific messaging

For non-founding subscriptions: keep calling `stripe-checkout` for now (placeholder — will be swapped to `payplus-checkout` later when PayPlus is set up).

## Step 7: Update CheckoutSuccess Page

Add founding partner variant that shows:
- "Welcome, Founding Partner!"
- Trial end date
- "3 free featured listings available now"
- CTA to go to dashboard

## Step 8: `check-trial-expirations` Cron Edge Function

Daily cron that:
- Finds `subscriptions WHERE status = 'trialing' AND trial_end < now()`
- Sets `status = 'expired'` (PayPlus charge initiation added later)
- Could send notification email via existing `send-notification` function

## Step 9: Update `grant-monthly-featured-credits`

Ensure it only grants credits during the `free_credits_duration_months` window (2 months) for founding partners, then stops.

---

## What's deferred until PayPlus is set up

- `payplus-checkout` edge function (actual payment collection)
- `payplus-webhook` edge function (IPN handling)
- `manage-billing` edge function (replaces `manage-subscription`)
- `list-invoices` update for PayPlus
- Featured listing ₪299/mo PayPlus recurring charge
- Trial-to-paid automatic charge initiation

---

## Summary of files touched

| Area | Files |
|------|-------|
| DB migration | Add columns to `subscriptions`, `featured_listings`; update promo code data |
| New edge function | `supabase/functions/enroll-founding-partner/index.ts` |
| New edge function | `supabase/functions/check-trial-expirations/index.ts` |
| Frontend hook | New `src/hooks/useFoundingSpots.ts` |
| Frontend update | `src/components/billing/FoundingProgramSection.tsx` — new benefits + spots counter |
| Frontend update | `src/components/billing/FoundingProgramModal.tsx` — new benefits + spots counter + enrollment call |
| Frontend update | `src/pages/Pricing.tsx` — founding enrollment path |
| Frontend update | `src/pages/CheckoutSuccess.tsx` — founding variant |
| Existing edge fn | `supabase/functions/grant-monthly-featured-credits/index.ts` — 2-month cap check |

