
# Phase D: Pricing UX Improvements

## Assessment: What Already Exists

Significant groundwork is already done:
- Feature comparison table (`FeatureComparisonTable.tsx`) — functional but sparse (6 rows)
- FAQ section (`PricingFAQ.tsx`) — 6 questions, already in place
- Founding Program section (`FoundingProgramSection.tsx`) — exists
- Promo code validation on blur (`PromoCodeInput.tsx`) — validates against DB and shows benefit summary inline

Phase D work focuses on the **remaining UX gaps** that separate a generic pricing page from a conversion-optimized one.

---

## Gaps to Close

### Gap 1 — Promo validation state not wired to plan cards
`PromoCodeInput` validates and calls `onValidated` but `Pricing.tsx` doesn't pass `onValidated`, so the validation result is lost. When a user enters `FOUNDING2026`, the plan cards should show a banner like "60-day free trial included" and the CTA should update to "Start Free Trial".

**Fix**: Wire `onValidated` in `Pricing.tsx`, store the result in state, pass it down to `PlanCard` as a `promoResult` prop. Plan cards update their CTA label and show a highlighted "Trial included" badge when a valid promo with trial days is active.

### Gap 2 — Annual savings in absolute ₪ not shown
The toggle shows "Save 20%" but doesn't tell users how much they save in actual currency. Zillow/Realtor.com always show the exact saving ("Save ₪4,320/yr").

**Fix**: In `Pricing.tsx` and `PlanCard.tsx`, calculate the absolute annual saving per plan and display it under the price when billing cycle is `annual`.

### Gap 3 — Feature comparison table is too sparse
Only 6 rows. Missing: Visibility Boosts, Promo Code Access, Analytics Dashboard, Listing Analytics, Blog Publishing, Support tier. Enterprise should show the custom pricing description.

**Fix**: Expand `FeatureComparisonTable.tsx` with ~5 additional feature rows, and add a special "Enterprise" styling for the Enterprise column header with a "Custom" price indicator.

### Gap 4 — No per-plan tagline / value proposition
Currently each plan card just shows a name and tier. There is no sentence explaining who the plan is for. Example: "Starter: Perfect for solo agents just getting started."

**Fix**: Add a `description` prop to `PlanCard` (driven by a static map in `Pricing.tsx`), displayed in small muted text under the tier label.

### Gap 5 — No trust signals below the CTA buttons
No money-back guarantee or security reassurance text on the plan cards or the pricing page header.

**Fix**: Add a "30-day satisfaction guarantee" note and a Stripe / SSL trust badge row to the pricing page between the plan cards and the feature comparison table.

### Gap 6 — No "Save ₪X" savings callout in BillingCycleToggle when annual plans exist
The toggle says "Save 20%" generically. When annual is selected and a plan is being viewed, the savings callout should be more prominent.

**Fix**: In `BillingCycleToggle.tsx`, update the "Annual" button pill to say "Save 20% · Billed yearly" with a slightly bigger badge.

---

## Files to Modify

| File | Change |
|---|---|
| `src/pages/Pricing.tsx` | Wire `onValidated` from PromoCodeInput; store promo result; pass it to PlanCard; add per-plan descriptions map; add trust badge row |
| `src/components/billing/PlanCard.tsx` | Add `description` prop; add `promoResult` prop; update CTA label to "Start Free Trial" when trial promo; show "Trial included" badge; show annual saving in ₪ |
| `src/components/billing/FeatureComparisonTable.tsx` | Add 5+ feature rows: Boost Access, Blog Publishing, Analytics Dashboard, Listing Analytics, Support Level, API Access |
| `src/components/billing/BillingCycleToggle.tsx` | Improve annual pill to "Save 20% · Billed yearly" |

---

## Implementation Details

### Promo wiring in `Pricing.tsx`

```typescript
const [promoResult, setPromoResult] = useState<PromoValidation | null>(null);

<PromoCodeInput
  value={promoCode}
  onChange={setPromoCode}
  onValidated={setPromoResult}
/>
```

Then pass `promoResult` to each `PlanCard`.

### PlanCard CTA update

When `promoResult?.valid && promoResult.trialDays > 0`:
- CTA button label: "Start Free Trial"
- Show a small badge under the price: "60-day free trial included"
- Keep the `onSubscribe` handler (promo code is passed in the checkout body)

### Per-plan descriptions (static map)

```typescript
const PLAN_DESCRIPTIONS: Record<string, string> = {
  starter: 'Perfect for solo agents getting started',
  growth: 'For growing teams ready to scale',
  pro: 'For established agencies at full capacity',
  enterprise: 'Custom solutions for large organizations',
};
```

### Feature comparison additions

New rows (all boolean or string values):
- **Visibility Boosts** — all plans: true
- **Blog Publishing** — Starter: 3/mo, Growth: 4/mo, Pro: 6/mo, Enterprise: Unlimited
- **Analytics Dashboard** — Starter: false, Growth: true, Pro: true, Enterprise: true
- **Listing Analytics** — Starter: Basic, Growth: Full, Pro: Full, Enterprise: Full
- **Support Level** — Starter: Email, Growth: Email, Pro: Priority, Enterprise: Dedicated

### Annual savings display in PlanCard

```typescript
const annualSaving = billingCycle === 'annual' && !isEnterprise
  ? Math.round((priceMonthly ?? 0) * 12 - (priceAnnual ?? 0))
  : 0;
```

Show below the annual billed line: `Save ₪{annualSaving.toLocaleString()} vs. monthly`

---

## No Backend Changes
All changes are purely frontend/UI. No database migrations, no edge functions.
