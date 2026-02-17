

# Phase 2: Stripe Integration and Subscription/Credit Purchase Backend

## Overview
Connect Stripe to BuyWise so agencies and developers can subscribe to membership plans and purchase credit packages. This phase builds the backend functions that create Stripe customers, manage subscriptions with promo codes, handle credit package purchases, and process Stripe webhooks. No subscription UI yet -- this phase delivers the plumbing.

## What Gets Built

### 1. Enable Stripe Integration
Use the Lovable Stripe integration to connect your Stripe account. This provides the secret key needed for all backend operations.

### 2. Edge Function: `stripe-checkout` (Subscription Checkout)
Creates a Stripe Checkout Session for subscribing to a membership plan.

**Flow:**
1. Authenticated user (agency admin or developer) calls this function with `plan_id`, `billing_cycle`, and optional `promo_code`
2. Function looks up the `membership_plans` row to get ILS pricing
3. Creates or retrieves a Stripe Customer (stored on `subscriptions.stripe_customer_id`)
4. If promo code provided, validates it against `promo_codes` table, creates a Stripe Coupon with the matching discount
5. Creates a Stripe Checkout Session in `subscription` mode with:
   - ILS currency
   - Trial period from promo code (e.g., 60 days for FOUNDING2026)
   - Coupon applied for discount duration
   - `success_url` and `cancel_url` back to the dashboard
6. Returns the Checkout URL to redirect the user

### 3. Edge Function: `stripe-credit-checkout` (Credit Package Purchase)
Creates a Stripe Checkout Session for one-time credit package purchases.

**Flow:**
1. Authenticated user calls with `package_id`
2. Function looks up `credit_packages` for pricing
3. Creates Checkout Session in `payment` mode (one-time)
4. Returns the Checkout URL

### 4. Edge Function: `stripe-webhook` (Event Handler)
Processes Stripe webhook events to sync payment state back to the database.

**Handled events:**
- `checkout.session.completed` -- Creates the `subscriptions` row (for subscription checkouts) or records credit purchase transaction (for one-time payments)
- `invoice.paid` -- Updates `current_period_start/end` on the subscription, grants monthly promo credits if applicable
- `invoice.payment_failed` -- Sets subscription status to `past_due`
- `customer.subscription.updated` -- Syncs status changes (active, canceled, etc.)
- `customer.subscription.deleted` -- Marks subscription as canceled

**For promo code credit grants:**
When `invoice.paid` fires monthly, the webhook checks `subscription_promo_redemptions` and the promo's `credit_schedule` array. If credits are due for this month, it inserts a `credit_transactions` row with `transaction_type = 'promo_grant'` and updates `credit_months_granted`.

### 5. Edge Function: `manage-subscription` (Portal Access)
Creates a Stripe Billing Portal session so users can:
- Update payment method
- View invoices
- Cancel subscription

Returns the portal URL for redirect.

### 6. Database Helper Function: `record_credit_purchase`
A `SECURITY DEFINER` function called by the webhook to safely insert credit transactions with correct `balance_after` calculation. This prevents race conditions by running in a single transaction.

### 7. Stripe Product/Price Sync
On first deployment, the `stripe-checkout` function will create Stripe Products and Prices for each `membership_plan` and `credit_package`, storing the Stripe Price IDs back in the database (new columns: `stripe_price_monthly_id`, `stripe_price_annual_id` on `membership_plans`; `stripe_price_id` on `credit_packages`).

---

## Database Changes

### Migration: Add Stripe reference columns

**`membership_plans`** -- Add columns:
- `stripe_product_id` text (Stripe Product reference)
- `stripe_price_monthly_id` text (Stripe Price for monthly billing)
- `stripe_price_annual_id` text (Stripe Price for annual billing)

**`credit_packages`** -- Add columns:
- `stripe_product_id` text
- `stripe_price_id` text

These columns are populated by the edge functions on first use (lazy sync pattern).

---

## Security

- `stripe-webhook` uses `verify_jwt = false` (Stripe signs requests) and validates the Stripe signature using `STRIPE_WEBHOOK_SECRET`
- All other functions require authenticated users
- Credit transactions are only inserted via service role (webhook or security definer functions)
- Stripe Customer IDs are stored per subscription, preventing cross-entity access

## Secrets Needed
- `STRIPE_SECRET_KEY` -- Provided via the Lovable Stripe integration
- `STRIPE_WEBHOOK_SECRET` -- Generated when creating the webhook endpoint in Stripe

---

## What Is NOT in Phase 2
- No subscription UI / pricing page (Phase 3)
- No credit purchase UI (Phase 3)
- No listing limit enforcement yet (Phase 4)
- No boost activation flow (Phase 4)

---

## Technical Details

### File Structure
```text
supabase/functions/
  stripe-checkout/index.ts        -- Subscription checkout
  stripe-credit-checkout/index.ts -- Credit package checkout
  stripe-webhook/index.ts         -- Webhook handler
  manage-subscription/index.ts    -- Billing portal
```

### Webhook Registration
After deployment, you will need to register the webhook URL in Stripe:
`https://<project-ref>.supabase.co/functions/v1/stripe-webhook`

Events to subscribe to:
- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.updated`
- `customer.subscription.deleted`

### ILS Currency Handling
All Stripe prices are created in ILS (currency code `ils`). Stripe handles ILS in agorot (smallest unit), so prices are multiplied by 100 before sending to Stripe (e.g., 149 ILS = 14900 agorot).

### Promo Code to Stripe Coupon Mapping
When a promo code is applied during checkout:
1. Function reads `promo_codes.discount_percent` and `discount_duration_months`
2. Creates a Stripe Coupon with `percent_off` and `duration = 'repeating'` with `duration_in_months`
3. Applies to the Checkout Session
4. Trial days are set via `subscription_data.trial_period_days`

