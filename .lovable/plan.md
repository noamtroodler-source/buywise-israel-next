
# Phase A: Data Correction

All changes in this phase are **data updates only** — no schema changes, no code changes. Every fix is a SQL UPDATE/INSERT run against existing tables.

---

## What's Being Fixed

### 1. Membership Plan Prices

**Agency plans** (annual = monthly × 12 × 0.8):

| Plan | Monthly (now → spec) | Annual (now → spec) |
|---|---|---|
| Agency Starter | ₪149 → ₪750 | ₪1,430 → ₪7,200 |
| Agency Growth | ₪349 → ₪1,950 | ₪3,350 → ₪18,720 |
| Agency Pro | ₪749 → ₪4,200 | ₪7,190 → ₪40,320 |
| Agency Enterprise | ₪1,499 → NULL (custom) | ₪14,390 → NULL (custom) |

**Developer plans**:

| Plan | Monthly (now → spec) | Annual (now → spec) |
|---|---|---|
| Dev Starter | ₪199 → ₪1,500 | ₪1,910 → ₪14,400 |
| Dev Growth | ₪499 → ₪3,900 | ₪4,790 → ₪37,440 |
| Dev Pro | ₪999 → ₪7,900 | ₪9,590 → ₪75,840 |
| Dev Enterprise | ₪1,999 → NULL (custom) | ₪19,190 → NULL (custom) |

---

### 2. Listing Limits

| Plan | Current → Spec |
|---|---|
| Agency Starter | 15 → 20 |
| Agency Pro | 150 → 100 |
| Dev Starter | 3 → 2 |
| Dev Growth | 10 → 5 |
| Dev Pro | 30 → 15 |

(Agency Growth=50✅, Agency Enterprise=NULL✅, Dev Enterprise=NULL already correct)

---

### 3. Seat Limits

| Plan | Current → Spec |
|---|---|
| Agency Starter | 2 → 1 |
| Dev Starter | 1 → 2 |
| Dev Growth | 3 → 5 |
| Dev Pro | 5 → 10 |

(Agency Growth=5✅, Agency Pro=15✅, Agency Enterprise=999→NULL for unlimited)

---

### 4. Blog Limits

| Plan | Current → Spec |
|---|---|
| Agency Growth | 5 → 4 |
| Agency Pro | 15 → 6 |
| Agency Enterprise | 999 → NULL (unlimited) |
| Dev Starter | 1 → 3 |
| Dev Growth | 3 → 6 |
| Dev Pro | 10 → 8 |
| Dev Enterprise | 999 → NULL (unlimited) |

(Agency Starter=2✅ already correct)

---

### 5. Credit Packages

| Package | Credits (now → spec) | Bonus (unchanged) | Price (now → spec) |
|---|---|---|---|
| Starter | 50 → 50 ✅ | 0% | ₪99 → ₪1,000 |
| Growth | 150 → 150 ✅ | +10% | ₪249 → ₪3,000 |
| Pro | 500 → 400 | +20% | ₪699 → ₪8,000 |
| Dominator | 1500 → 1000 | +30% | ₪1,799 → ₪20,000 |

---

### 6. Visibility Products — Credit Costs

Current DB already has many products correct. The deltas vs. spec:

| Product | Current → Spec |
|---|---|
| Homepage Sale Featured | 30 → 70 credits/week |
| Homepage Rent Featured | 25 → 50 credits/week |
| City Spotlight | 20 → 25 credits/week |
| Agency Directory Featured | 25 → 90 credits/30d |
| Developer Directory Featured | 25 → 120 credits/30d |
| Email Digest Sponsored | 35 → 80 credits/send |

Already correct (no change needed):
- Homepage Project Hero: 150 ✅
- Homepage Project Secondary: 90 ✅
- Projects Boost: 60 ✅
- Budget Tool Sponsor: 50 ✅
- Search Priority Boost: 15 ✅
- Similar Listings Priority: 10 ✅

---

## Technical Approach

All of this is **pure data** — no schema migrations needed. I'll use the **Supabase data tool** (INSERT/UPDATE) to run the corrections directly:

1. One batch UPDATE for all 8 membership plans (prices + limits)
2. One batch UPDATE for all 4 credit packages
3. Targeted UPDATEs for the 6 visibility products with wrong credit costs

**Enterprise plans**: `price_monthly_ils` and `price_annual_ils` will be set to `NULL` (or `0`). The `PlanCard` component already has `isEnterprise` logic that shows "Contact Sales" — but after checking the current code, the card still reads the price to display. I'll set prices to `0` and update the `PlanCard` to treat `isEnterprise` as the source of truth for showing "Contact Sales" (price display suppressed when enterprise).

**Impact on existing subscriptions**: These are plan definition changes, not subscription changes. Any agency/developer already subscribed keeps their existing subscription record intact — only the plan card display and future checkouts will reflect the new prices.

---

## Files to Modify (Code)

One small code change is needed alongside the data fix:

**`src/components/billing/PlanCard.tsx`** — When `isEnterprise`, suppress the price display entirely and ensure the CTA is always "Contact Sales" (not tied to the price value). This was partially done in Phase E but needs to be confirmed clean for `price = 0` or `price = NULL`.

---

## Execution Order

1. Run data UPDATE SQL for membership plans
2. Run data UPDATE SQL for credit packages  
3. Run data UPDATE SQL for visibility products
4. Minor code tweak to PlanCard for NULL enterprise pricing
