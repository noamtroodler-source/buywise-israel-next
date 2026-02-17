

# Phase 1: Monetization Database Foundation

## Overview
Build all the database tables needed for Engine 1 (Membership/Access) and Engine 2 (Visibility/Credits), including the promo code system that powers the Founding Program. No UI in this phase -- just the clean, well-structured backend.

## What Gets Built

### 8 New Tables

**1. `membership_plans`** -- Tier definitions for both agencies and developers

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| entity_type | text | 'agency' or 'developer' |
| tier | text | 'starter', 'growth', 'pro', 'enterprise' |
| name | text | Display name |
| max_listings | int | Active listing cap (null = unlimited) |
| max_seats | int | Seat cap |
| max_blogs_per_month | int | Blog quota |
| price_monthly_ils | numeric | Monthly price in ILS |
| price_annual_ils | numeric | Annual price in ILS |
| is_active | boolean | Can new subscribers pick this? |
| sort_order | int | Display ordering |

Seeded with the 8 tiers from the spec (4 agency + 4 developer).

**2. `subscriptions`** -- One active subscription per agency or developer

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| entity_type | text | 'agency' or 'developer' |
| entity_id | uuid | FK to agencies.id or developers.id |
| plan_id | uuid FK | Which membership_plan |
| billing_cycle | text | 'monthly' or 'annual' |
| status | text | 'trialing', 'active', 'past_due', 'canceled' |
| trial_start | timestamptz | |
| trial_end | timestamptz | |
| current_period_start | timestamptz | |
| current_period_end | timestamptz | |
| stripe_customer_id | text | Stripe reference |
| stripe_subscription_id | text | Stripe reference |
| canceled_at | timestamptz | |
| created_by | uuid | User who subscribed |

**3. `promo_codes`** -- Reusable promo system (founding program = first code)

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| code | text UNIQUE | e.g. 'FOUNDING2026' |
| description | text | Internal note |
| trial_days | int | Free trial duration |
| discount_percent | numeric | Post-trial discount |
| discount_duration_months | int | How long discount lasts |
| credit_schedule | jsonb | Array of monthly credit grants |
| credit_type | text | 'unrestricted' or 'engine2_only' |
| applies_to | text | 'agency', 'developer', or 'all' |
| max_redemptions | int | null = unlimited |
| times_redeemed | int | Counter |
| is_active | boolean | Admin toggle to close enrollment |
| valid_from | timestamptz | |
| valid_until | timestamptz | null = open-ended |

**4. `subscription_promo_redemptions`** -- Links subscription to promo used

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| subscription_id | uuid FK | |
| promo_code_id | uuid FK | |
| redeemed_at | timestamptz | |
| credit_months_granted | int | Tracks progress through schedule |

**5. `credit_packages`** -- Purchasable credit bundles

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| name | text | 'Starter', 'Growth', 'Pro', 'Dominator' |
| credits_included | int | What you get |
| price_ils | numeric | What you pay |
| bonus_percent | numeric | Display: "10% bonus" |
| is_active | boolean | |
| sort_order | int | |

Seeded with the 4 packages from the spec.

**6. `credit_transactions`** -- Append-only ledger (THE source of truth for balances)

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| entity_type | text | 'agency' or 'developer' |
| entity_id | uuid | |
| amount | int | Positive = credit in, negative = spend |
| balance_after | int | Running balance snapshot |
| transaction_type | text | 'purchase', 'spend', 'promo_grant', 'blog_reward', 'expiry', 'admin_grant' |
| credit_type | text | 'unrestricted' or 'engine2_only' |
| reference_id | uuid | FK to boost, package purchase, etc. |
| description | text | Human-readable note |
| expires_at | timestamptz | For blog-earned credits (end of month) |
| created_at | timestamptz | |

Balance is calculated as `SUM(amount) WHERE entity_type = X AND entity_id = Y AND (expires_at IS NULL OR expires_at > now())`.

**7. `visibility_products`** -- The 9 boost products

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| slug | text UNIQUE | e.g. 'homepage_sale_featured' |
| name | text | Display name |
| description | text | |
| credit_cost | int | Credits per activation |
| duration_days | int | How long it runs |
| max_slots | int | Inventory cap (null = unlimited) |
| applies_to | text | 'agency', 'developer', or 'all' |
| is_active | boolean | |

Seeded with all 9 products from the spec.

**8. `active_boosts`** -- Currently running boosts

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid PK | |
| product_id | uuid FK | Which visibility product |
| entity_type | text | |
| entity_id | uuid | Who bought it |
| target_type | text | 'property', 'project', 'agency', 'developer' |
| target_id | uuid | What's being boosted |
| credit_transaction_id | uuid FK | Payment reference |
| starts_at | timestamptz | |
| ends_at | timestamptz | |
| slot_position | int | For ordered slots (e.g. hero vs secondary) |
| is_active | boolean | |

---

### Database Functions

**`get_credit_balance(p_entity_type, p_entity_id)`** -- Returns current usable balance (excluding expired credits).

**`get_active_boost_count(p_product_id)`** -- Returns how many slots are currently occupied for inventory management.

---

### RLS Policies

- **membership_plans**: Public SELECT (everyone can see pricing), admin-only INSERT/UPDATE
- **subscriptions**: Owner can SELECT their own; admins can SELECT/UPDATE all
- **promo_codes**: Public SELECT on active codes (for validation); admin-only INSERT/UPDATE
- **subscription_promo_redemptions**: Owner SELECT; system INSERT via service role
- **credit_packages**: Public SELECT; admin-only INSERT/UPDATE
- **credit_transactions**: Owner SELECT their own; INSERT via service role only (no client-side credit manipulation)
- **visibility_products**: Public SELECT; admin-only INSERT/UPDATE
- **active_boosts**: Public SELECT (needed to display badges/positions); owner INSERT; admin UPDATE

---

### Seed Data

The migration will also seed:
- 8 membership plans (4 agency tiers + 4 developer tiers) with the exact pricing from the spec
- 4 credit packages (Starter/Growth/Pro/Dominator)
- 9 visibility products with costs and durations from the spec
- 1 promo code: `FOUNDING2026` with 60-day trial, 25% discount for 10 months, unrestricted credit schedule [150,150,50,50,50,50,50,50,50,50,50,50]

---

## What Is NOT in Phase 1

- No Stripe integration (Phase 2)
- No UI for subscribing or purchasing credits
- No enforcement of listing limits yet
- No boost activation logic
- No blog reward triggers

These all build cleanly on top of the tables created here.

## Technical Notes

- All tables use `uuid` primary keys with `gen_random_uuid()` defaults
- Entity ownership is determined by joining through `agencies` or `developers` tables to `user_id`
- The credit ledger is append-only by design -- no UPDATE/DELETE policies for `credit_transactions`
- `balance_after` on each transaction enables fast balance lookups without scanning the full ledger
- Validation triggers (not CHECK constraints) will enforce business rules like "cannot spend more than balance"

