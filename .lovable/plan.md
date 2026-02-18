
# Annual Billing Confirmation Flow — Complete Plan

## Problem Statement

The toggle to switch between Monthly and Annual billing has no friction or clarity around what "Annual" means in practice. A user can switch to Annual and click Subscribe without ever reading that they are committing to a 12-month payment billed as a lump sum. There is also no post-purchase summary confirming which cycle they selected.

There are 5 specific gaps, described below in order of user journey.

---

## Gap 1 — The Toggle Gives No Context When Annual Is Active

**Current state:** The `BillingCycleToggle` has a `text-[10px]` chip reading "Save 20% · Billed yearly" that is always visible — even when Monthly is selected — making it feel decorative rather than informative. When Annual is selected, the chip simply moves with it; there is no secondary explanation.

**Fix:** Add a contextual callout banner directly below the toggle (between the toggle row and the plan cards). It renders only when `billingCycle === 'annual'` and reads:

> Annual plans are billed as a single payment for the full year. You save 20% vs. paying month-to-month, and the plan renews automatically after 12 months.

This is an amber-tinted informational strip — not an error or warning — using `Info` icon and the same `Alert` component used across the billing UI. It disappears when switching back to Monthly.

**File:** `src/pages/Pricing.tsx` — add the conditional banner between the Controls section and the Plan Cards grid.

---

## Gap 2 — No Confirmation Step Before Sending Annual Users to Checkout

**Current state:** Clicking "Subscribe" when Annual is selected immediately fires `handleSubscribe`, which opens the Stripe checkout session in a new tab. There is no moment where the user sees "you're about to pay ₪X for 12 months" before leaving the site.

**Fix:** Intercept the Subscribe action with a lightweight confirmation dialog: `AnnualBillingConfirmDialog`.

Triggered only when `billingCycle === 'annual'` and the plan is not Enterprise. When Monthly, clicking Subscribe proceeds as before with no interruption.

**Dialog contents:**
- Header: "Confirm Annual Billing"
- Entity badge (Agency / Developer) matching the style used in `EnterpriseSalesDialog`
- Plan name + tier
- Summary row: `₪[monthlyEquivalent]/mo equivalent · ₪[totalAnnual] billed today`
- Savings callout: `You save ₪[annualSaving] compared to monthly billing`
- Commitment note: `This is a 12-month commitment. Your plan renews automatically on [date 12 months from today]. Cancel anytime from your billing portal before renewal.`
- Two buttons: `Confirm & Continue →` (calls `handleSubscribe`) and `Go Back`

**Files:**
- New: `src/components/billing/AnnualBillingConfirmDialog.tsx`
- Edit: `src/components/billing/PlanCard.tsx` — when `billingCycle === 'annual'`, clicking Subscribe sets `confirmDialogOpen = true` instead of calling `onSubscribe` directly. The dialog then calls `onSubscribe` on confirm.
- Edit: `src/pages/Pricing.tsx` — no change needed; `onSubscribe` is passed down as-is.

---

## Gap 3 — Subscribe Button Label Does Not Reflect the Commitment

**Current state:** The CTA on `PlanCard` always reads "Subscribe" regardless of billing cycle.

**Fix:** When `billingCycle === 'annual'`, update the CTA label to `Subscribe — Annual Plan` (or simply `Get Annual Plan`). This makes the commitment legible before the user even clicks.

**File:** `src/components/billing/PlanCard.tsx` — extend the `ctaLabel` logic.

---

## Gap 4 — Toggle Chip Is Too Small and Structurally Passive

**Current state:** The "Save 20% · Billed yearly" chip inside the toggle button is `text-[10px]`, which is below comfortable reading size. It also appears inline inside the button, making it easy to miss.

**Fix:** Redesign the Annual button label layout:
- Main label: `Annual` (same size as Monthly)
- Below it, a small `text-[11px]` secondary line: `Save 20%` in `text-primary` weight, visible only on the Annual button
- Remove the chip element entirely — the savings message becomes part of the button text hierarchy

This makes the toggle scannable at a glance and looks cleaner than the current inline chip.

**File:** `src/components/billing/BillingCycleToggle.tsx`

---

## Gap 5 — CheckoutSuccess Has No Billing Cycle Summary

**Current state:** After completing checkout (whether monthly or annual), the user lands on a generic "Subscription Active!" page. There is no mention of what they just committed to.

**Fix:** Pass the billing cycle through the success URL as a query param in `handleSubscribe`:

```
success_url: `${window.location.origin}/checkout/success?cycle=annual`
```

Then update `CheckoutSuccess.tsx` to detect the `cycle` param and render an additional line when annual:

> You're on an annual plan — your next renewal is in 12 months.

This closes the loop and removes any post-purchase doubt.

**Files:**
- Edit: `src/pages/Pricing.tsx` — append `?cycle=${billingCycle}` to the `success_url` in `handleSubscribe`
- Edit: `src/pages/CheckoutSuccess.tsx` — read `cycle` param, conditionally render the renewal note

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/components/billing/AnnualBillingConfirmDialog.tsx` | New | Lightweight confirmation dialog showing annual total, savings, and 12-month commitment note |
| `src/components/billing/BillingCycleToggle.tsx` | Edit | Redesign Annual button: replace `text-[10px]` chip with cleaner two-line layout |
| `src/components/billing/PlanCard.tsx` | Edit | Wire Subscribe to open confirm dialog when annual; update CTA label to reflect commitment |
| `src/pages/Pricing.tsx` | Edit | Add contextual annual callout banner below the toggle; append `cycle` param to success URL |
| `src/pages/CheckoutSuccess.tsx` | Edit | Read `cycle` param; render 12-month renewal note when annual |

---

## Technical Notes

- `AnnualBillingConfirmDialog` is self-contained — it receives `planName`, `priceMonthly`, `priceAnnual`, `entityType`, `onConfirm`, and `onCancel` as props. No new hooks or DB queries needed.
- The renewal date shown in the dialog is computed client-side: `addYears(new Date(), 1)` from `date-fns` — already installed.
- The dialog uses the same `Dialog`, `Button`, `Badge` primitives used throughout billing components — no new dependencies.
- Monthly flow is completely untouched — all 5 changes are conditional on `billingCycle === 'annual'`. Monthly users see zero difference.
- The success URL `cycle` param is optional — if somehow missing, `CheckoutSuccess` falls back to the current generic message.
- No DB changes, no edge function changes, no new secrets required.
