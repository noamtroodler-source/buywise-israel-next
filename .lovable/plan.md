

## Phase 1: Founding Partner Enrollment — Implemented ✅

All changes from the plan have been implemented:

1. **DB Migration** — Added `is_founding_partner`, `payplus_customer_id`, `payplus_subscription_id` to `subscriptions`; `payplus_subscription_id` to `featured_listings`. Updated FOUNDING2026 promo code (max_redemptions=15, cleared old discount/credit data).
2. **`enroll-founding-partner` edge function** — 15-cap enforcement, trial creation (60 days), founding_partners insert, first month credit grant, promo redemption tracking.
3. **`check-trial-expirations` edge function** — Daily cron (6 AM UTC) expires trialing subscriptions past trial_end.
4. **`useFoundingSpots` hook** — Live spots remaining counter querying founding_partners.
5. **`FoundingProgramSection`** — Updated benefits (2mo free, 3 featured/mo, early access, case study), spots counter badge.
6. **`FoundingProgramModal`** — Updated benefits, spots counter, activates enrollment flow.
7. **`Pricing.tsx`** — FOUNDING2026 code routes to `enroll-founding-partner` instead of Stripe; CTA changes to "Activate Founding Program".
8. **`CheckoutSuccess.tsx`** — Founding partner variant with trial end date and featured listings CTA.
9. **`grant-monthly-featured-credits`** — Already has 2-month duration cap logic.
10. **`PlanCard`** — Added `ctaLabel` prop for custom CTA text.

### Deferred (PayPlus not yet set up):
- `payplus-checkout`, `payplus-webhook`, `manage-billing` edge functions
- `list-invoices` PayPlus integration
- Featured listing ₪299/mo PayPlus recurring charge
- Trial-to-paid automatic charge initiation
