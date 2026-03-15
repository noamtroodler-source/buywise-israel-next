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

## Phase 2: CBS Data Organization — Implemented ✅

**Data Source:** All data in these tables originates from **Nadlan.gov.il — Ministry of Justice, Israel** (official government property transaction records). This is the same authoritative source used for `sold_transactions`.

1. **`city_price_history` table** — Quarterly avg transaction prices by city + room count (3/4/5), 2020-2025, with national comparison. ~1,625 rows from `market_data.csv`.
2. **`neighborhood_price_history` table** — Quarterly prices by neighborhood + room count, with yield and YoY. ~52,398 rows from `neighborhood_data.csv`.
3. **`import-cbs-data` edge function** — Admin-only bulk importer, accepts parsed CSV rows, upserts in batches of 500.
4. **Admin import page** — `/admin/import-cbs-data` with file upload for both CSVs.
5. **Public read-only RLS** — Both tables have SELECT-only policies (public government data).

### Next steps (not yet built):
- City page trend charts using `city_price_history`
- Neighborhood comparison widgets using `neighborhood_price_history`
- AI market insights grounded in neighborhood-level data
