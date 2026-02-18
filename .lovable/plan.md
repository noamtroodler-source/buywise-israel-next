
# Fix: Pre-Sync All Stripe Products & Prices

## The Problem

All 8 membership plans have no Stripe IDs yet. The current lazy-sync in `stripe-checkout` works, but has two real risks:

1. **Race condition**: Two users subscribing to the same plan at the same time, before the first write-back completes, will create duplicate Stripe products. Stripe charges you per product created, and your catalog becomes messy.
2. **Enterprise crash**: Plans with `price_monthly_ils = null` will cause `Math.round(null * 100) = 0` → Stripe rejects a zero-amount price → 500 error for any Enterprise checkout.
3. **No visibility**: Right now you cannot see which plans are synced until someone actually tries to subscribe.

## The Fix (2 parts)

### Part 1 — Admin sync edge function (`sync-stripe-plans`)

A new edge function callable from a one-time admin trigger (or a button in the admin panel) that:

- Loops through all 6 non-Enterprise active plans (those with a price)
- For each plan:
  - Checks if `stripe_product_id` already exists → skips creation if so
  - Creates the Stripe **Product** if not yet created
  - Checks if `stripe_price_monthly_id` already exists → skips if so
  - Creates the Stripe **monthly Price** (recurring, ILS)
  - Checks if `stripe_price_annual_id` already exists → skips if so
  - Creates the Stripe **annual Price** (recurring, ILS, yearly)
  - Writes all three IDs back to `membership_plans` in a single update
- Returns a summary of what was created vs. skipped (so you can see the result)
- Is **fully idempotent** — safe to re-run multiple times without creating duplicates

### Part 2 — Harden `stripe-checkout` against race conditions

Add an upsert guard in the lazy-sync path: before creating a new Stripe product, re-fetch the plan from DB inside a short retry loop to see if another request already created it. This prevents the (unlikely but possible) simultaneous first-checkout race condition.

Also add a clear error for Enterprise plans: if `price_monthly_ils` or `price_annual_ils` is null, return a 400 with message `"Enterprise plans require a custom quote — please contact us"` instead of crashing.

### Part 3 — Admin UI button to trigger the sync

Add a "Sync Stripe Prices" button to the admin panel (wherever the admin billing/plans section lives) that:
- Calls `sync-stripe-plans`
- Shows a loading spinner
- Shows a toast with the result: e.g. "6 plans synced — 12 prices created"
- After sync, you can see the Stripe IDs directly in your Stripe dashboard

## Technical Details

### New edge function: `supabase/functions/sync-stripe-plans/index.ts`

```
POST /functions/v1/sync-stripe-plans
Authorization: Bearer <admin-token>

Response:
{
  "synced": 6,
  "created_products": 6,
  "created_prices": 12,
  "skipped": 0,
  "plans": [
    { "name": "Agency Starter", "product_id": "prod_xxx", "monthly": "price_xxx", "annual": "price_xxx" },
    ...
  ]
}
```

The function:
- Requires admin auth (checks `user_roles` for `admin` role)
- Queries all `membership_plans` where `is_active = true` and `price_monthly_ils IS NOT NULL`
- For each plan runs the idempotent create-or-skip logic
- Updates the DB row and returns the summary

### Files changed

| File | Change |
|---|---|
| `supabase/functions/sync-stripe-plans/index.ts` | New — one-shot admin sync function |
| `supabase/functions/stripe-checkout/index.ts` | Harden: add Enterprise guard + re-fetch before creating product |
| `supabase/config.toml` | Add `[functions.sync-stripe-plans] verify_jwt = false` |
| `src/pages/admin/...` (admin panel) | Add "Sync Stripe Prices" button that calls the function |

### What happens after you run this

1. All 6 plans get `stripe_product_id`, `stripe_price_monthly_id`, and `stripe_price_annual_id` populated in the DB
2. Every subsequent checkout call hits the fast path (`plan[priceColumn]` is already set) — no more lazy creation
3. No more race condition risk
4. Enterprise plans return a clean error message instead of crashing

### No database migrations needed
This is purely a data-population operation. No schema changes.
