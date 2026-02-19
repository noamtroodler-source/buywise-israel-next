
# Tier-Specific Plan Card CTAs

## What's Changing

The `ctaLabel` in `PlanCard.tsx` currently resolves to the generic string `'Subscribe'` (monthly) or `'Get Annual Plan'` (annual) for all non-trial, non-current plans. A single targeted change in one file replaces those generic fallbacks with tier-aware, action-oriented labels.

## CTA Label Map

The `tier` prop is already passed into `PlanCard` from `Pricing.tsx` (values: `'starter'`, `'growth'`, `'pro'`, `'enterprise'`). The enterprise card has its own fixed "Contact Sales" button so it is unaffected.

| Tier | Monthly label | Annual label |
|---|---|---|
| `starter` | Start with Starter | Get Starter Annual |
| `growth` | Scale with Growth | Get Growth Annual |
| `pro` | Go Pro | Go Pro Annual |
| Enterprise | Contact Sales *(unchanged)* | — |

The trial promo override (`Start {N}-Day Free Trial`) and `Current Plan` state keep their priority — they only apply when the user has an active promo or is already subscribed, so the new tier labels only surface in the normal purchase flow.

## Priority Order (unchanged logic, new fallback labels)

```
isCurrentPlan    → "Current Plan"
loading          → "Loading..."
hasTrialPromo    → "Start {N}-Day Free Trial"
billingCycle=annual → tier-specific annual label   ← NEW
default (monthly)   → tier-specific monthly label  ← NEW
```

## Implementation

**One file to edit: `src/components/billing/PlanCard.tsx`**

Replace the `ctaLabel` constant (currently lines 60–68):

```typescript
// Current (generic):
const ctaLabel = isCurrentPlan
  ? 'Current Plan'
  : loading
    ? 'Loading...'
    : hasTrialPromo
      ? `Start ${trialDays}-Day Free Trial`
      : billingCycle === 'annual'
        ? 'Get Annual Plan'
        : 'Subscribe';

// New (tier-aware):
const MONTHLY_CTA: Record<string, string> = {
  starter: 'Start with Starter',
  growth: 'Scale with Growth',
  pro: 'Go Pro',
};

const ANNUAL_CTA: Record<string, string> = {
  starter: 'Get Starter Annual',
  growth: 'Get Growth Annual',
  pro: 'Go Pro Annual',
};

const ctaLabel = isCurrentPlan
  ? 'Current Plan'
  : loading
    ? 'Loading...'
    : hasTrialPromo
      ? `Start ${trialDays}-Day Free Trial`
      : billingCycle === 'annual'
        ? (ANNUAL_CTA[tier] ?? 'Get Annual Plan')
        : (MONTHLY_CTA[tier] ?? 'Subscribe');
```

The `?? 'Subscribe'` / `?? 'Get Annual Plan'` fallbacks ensure any future tier added to the DB without a matching entry gracefully degrades to the original text — no breakage.

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/components/billing/PlanCard.tsx` | Edit | Add `MONTHLY_CTA` and `ANNUAL_CTA` maps; replace generic fallback strings with tier-keyed lookups |

No route changes. No new components. No DB changes. No other files touched.
