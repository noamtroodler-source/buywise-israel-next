

# Next Phase: Frontend Rewiring + FoundingMemberBanner Fix + TrialCountdownBanner Enhancement

Phase 1A, 2A, 2B, 2C, and 2D (trial expiration cron) are already built. The next steps are:

## What needs building now

### 1. Fix FoundingMemberBanner — outdated copy
The `FoundingMemberBanner.tsx` still shows old benefits: "25% off for 10 months", "Up to 800 free credits", and a credit schedule of "150 credits/mo" and "50 credits/mo". This needs to match the new spec:
- **60-day free trial** (already correct)
- **3 free featured listings/month** (replaces credits language)
- **Exclusive early access** (new)
- Remove the credit schedule grid entirely, replace with simpler benefit chips

### 2. Update TrialCountdownBanner — add "Add payment method" CTA
When trial is ending (e.g. <7 days left), show a secondary CTA: "Add payment method" that links to `/pricing` or a future PayPlus setup page. For now it links to `/pricing` since PayPlus isn't wired yet.

### 3. Frontend Rewiring — Stripe references → PayPlus placeholders

**Pricing.tsx (line 125):** Replace `stripe-checkout` invoke with a placeholder `payplus-checkout` call. Since PayPlus isn't set up yet, show a toast saying "Payment processing coming soon" for non-founding subscriptions. Founding enrollment path already works.

**BillingSection.tsx (line 20):** Replace `manage-subscription` invoke with `manage-billing` placeholder. For trialing users, show trial status instead of billing portal link.

**InvoiceHistoryTable.tsx (line 86):** Same — replace `manage-subscription` with `manage-billing`. For trialing users with no invoices, show appropriate messaging.

**PricingFAQ.tsx (line 31):** Update payment methods answer from "Stripe" to "secure payment processing" / PayPlus mention.

**AdminSettings.tsx:** Replace Stripe sync section with a "PayPlus Configuration" placeholder section (or hide it until PayPlus is ready).

### 4. Trust signals update on Pricing page
Line 246: Change "SSL-encrypted secure checkout" to "Secure ILS checkout" (remove implicit Stripe reference).

### 5. Update FOUNDING2026 promo code data
Use the insert tool to update the promo code row:
- Set `max_redemptions = 15`
- Set `discount_percent = 0`, `discount_duration_months = 0`
- Clear `credit_schedule` to null
- Keep `trial_days = 60`

---

## Files to modify

| File | Change |
|------|--------|
| `src/components/billing/FoundingMemberBanner.tsx` | Replace old benefit copy (25% off, 800 credits) with new spec (3 featured/mo, early access) |
| `src/components/billing/TrialCountdownBanner.tsx` | Add "Add payment method" CTA when <7 days left |
| `src/pages/Pricing.tsx` | Replace `stripe-checkout` with placeholder; update trust signal copy |
| `src/components/billing/BillingSection.tsx` | Replace `manage-subscription` with trial-aware logic |
| `src/components/billing/InvoiceHistoryTable.tsx` | Replace `manage-subscription` with trial-aware logic |
| `src/components/billing/PricingFAQ.tsx` | Remove Stripe mention in payment methods answer |
| `src/pages/admin/AdminSettings.tsx` | Replace Stripe sync section with PayPlus placeholder |
| DB data update | Update FOUNDING2026 promo code fields |

## Technical notes
- No new DB schema changes needed — this is all frontend + data update
- PayPlus edge functions (`payplus-checkout`, `payplus-webhook`, `manage-billing`) will be built in the next phase once PayPlus API keys are provided
- The non-founding checkout path will show a "coming soon" state until PayPlus is wired

