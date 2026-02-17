

# Phase 3: Subscription UI, Credit Purchase, and Billing Management

## Overview
Phase 2 built all the backend plumbing (edge functions, webhooks, database schema). Phase 3 adds the user-facing UI so agency admins and developers can actually subscribe to plans, buy credit packages, manage their billing, and see their current subscription/credit status.

## What Gets Built

### 1. Subscription Hook (`useSubscription`)
A shared React hook that fetches the current entity's subscription status from the `subscriptions` table, including plan details, trial info, and credit balance. Used across dashboards and settings.

- Queries `subscriptions` joined with `membership_plans` for the current user's agency or developer entity
- Returns: current plan name/tier, status (active/trialing/past_due/canceled), billing cycle, period end date, credit balance
- Auto-refreshes on window focus

### 2. Pricing Page (`/pricing`)
A new standalone page accessible from the Advertise page and dashboards, showing all membership plans and credit packages.

**Layout:**
- Toggle between Agency and Developer plans (auto-selects based on user role if logged in)
- Monthly/Annual billing toggle (annual shows savings badge)
- 4 plan cards per entity type (Starter / Growth / Pro / Enterprise) with:
  - Price in ILS per month (or per year)
  - Feature list (max listings, max seats, blog posts)
  - "Current Plan" badge if already subscribed
  - "Subscribe" button that calls `stripe-checkout`
- Promo code input field at the top
- Founding Program banner highlighting the FOUNDING2026 offer (60-day trial + 25% off)

**Below the plans:**
- Credit Packages section with 4 cards (Starter 50 / Growth 150 / Pro 500 / Dominator 1500)
  - Shows price, bonus %, and price-per-credit
  - "Buy Credits" button that calls `stripe-credit-checkout`

### 3. Subscription Status Card (Dashboard Widget)
A compact card added to the Agency Dashboard and Developer Dashboard showing:
- Current plan name and tier badge
- Status indicator (Active / Trial / Past Due)
- If trialing: days remaining in trial
- Current period end date
- Credit balance
- Quick action buttons: "Upgrade Plan", "Buy Credits", "Manage Billing"

### 4. Billing and Subscription Section in Settings
Add a "Billing" tab/section to both Agency Settings and Developer Settings pages:
- Current subscription details (plan, status, next billing date)
- "Change Plan" button (links to pricing page)
- "Manage Billing" button (calls `manage-subscription` edge function to open Stripe portal)
- Credit balance display
- "Buy Credits" button

### 5. Checkout Success/Cancel Pages
- `/checkout/success` - confirmation page with confetti animation, shows "Your subscription is now active" and links back to dashboard
- `/checkout/cancel` - simple page saying checkout was canceled with a "Return to Pricing" link

### 6. Update Advertise Page CTAs
Update the ProfessionalTypeChooser component and AdvertiseCTA to link to `/pricing` for existing users who want to see plans.

---

## File Structure

```text
src/
  hooks/
    useSubscription.ts          -- Shared subscription + credit balance hook
  pages/
    Pricing.tsx                 -- Full pricing page with plans + credits
    CheckoutSuccess.tsx         -- Post-checkout success page
    CheckoutCancel.tsx          -- Post-checkout cancel page
  components/
    billing/
      PlanCard.tsx              -- Individual membership plan card
      CreditPackageCard.tsx     -- Individual credit package card
      SubscriptionStatusCard.tsx -- Dashboard widget showing current plan
      BillingSection.tsx        -- Settings billing section
      PromoCodeInput.tsx        -- Promo code input with validation
      BillingCycleToggle.tsx    -- Monthly/Annual toggle
```

## Route Changes (App.tsx)
- Add `/pricing` route (public, no auth required to view)
- Add `/checkout/success` route
- Add `/checkout/cancel` route

## Dashboard Integration
- Agency Dashboard: Add `SubscriptionStatusCard` component after the header
- Developer Dashboard: Add `SubscriptionStatusCard` component after the header

## Settings Integration
- Agency Settings: Add a "Billing" tab with `BillingSection`
- Developer Settings: Add a "Billing" tab with `BillingSection`

## Data Flow

1. User visits `/pricing` and picks a plan
2. Frontend calls `stripe-checkout` edge function with `plan_id`, `billing_cycle`, and optional `promo_code`
3. Edge function returns Stripe Checkout URL
4. User is redirected to Stripe Checkout (new tab)
5. After payment, Stripe redirects to `/checkout/success`
6. Webhook processes the event and creates the subscription row in the database
7. Dashboard and settings pages reflect the new subscription via `useSubscription` hook

## Technical Details

### useSubscription Hook
```text
- Queries: subscriptions table joined with membership_plans
- Identifies entity: checks if user is agency admin (via agencies table) or developer
- Falls back gracefully if no subscription exists
- Also queries credit_transactions for current balance via the get_credit_balance RPC
- Returns loading/error states for UI
```

### Stripe Checkout Integration
```text
- All checkout calls use supabase.functions.invoke()
- Response contains { url } which is opened in a new tab
- Success/cancel URLs point to /checkout/success and /checkout/cancel
```

### Promo Code Validation
```text
- Client-side: basic format check
- Server-side: full validation happens in stripe-checkout edge function
- UI shows the promo code field with an "Apply" button
- If valid, shows discount preview (e.g., "25% off for 10 months + 60-day free trial")
```

## What Is NOT in Phase 3
- No listing limit enforcement (Phase 4)
- No boost activation flow (Phase 4)
- No credit spending/deduction UI (Phase 4)

