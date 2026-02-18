
# Overage Billing System — Engine 1

## What This Solves

Right now, when a subscriber exceeds their plan's listing or seat limit, the UI shows a soft-block ("Listing Limit Reached") and a hard-block on the submit button. That's it. There is no:
- Record of how many units are over the limit
- Per-month overage charge
- Admin visibility into which accounts owe overage fees
- Any linkage between overage and the invoice system

The pricing model explicitly states overages are *allowed* (not blocked), at a per-unit monthly cost. This plan fully implements that.

---

## Pricing Model Recap (overage rates)

| Type | Rate |
|---|---|
| Extra listing (agency) | ₪150 / listing / month |
| Extra project (developer) | ₪500 / project / month |
| Extra seat (agency) | ₪100 / seat / month |

These rates will live in the database so admin can change them without a code deploy.

---

## Current State Summary

- `useListingLimitCheck` → returns `canCreate: false` when over limit, blocks submit button
- `ListingLimitBanner` → shows warning text with the mock overage price (display-only)
- `useSeatLimitCheck` → same pattern for seats
- `membership_plans` table → has `max_listings`, `max_seats`, `max_blogs_per_month`
- `subscriptions` table → has `entity_type`, `entity_id`, billing cycle info
- No `overage_records` table exists
- No overage tracking logic exists
- The `InvoiceHistoryTable` currently lists Stripe invoices only — this will be adapted to show internal overage ledger records since PayPlus (not Stripe) will be the payment provider

---

## What We're Building

### Layer 1: Database

**New table: `overage_rates`** (admin-configurable)
```
id, entity_type, resource_type ('listing' | 'seat' | 'project'), rate_ils, effective_from, created_at
```
Seeded with the three rates from the pricing model. Admin can insert new rows to change rates going forward without touching code.

**New table: `overage_records`**
```
id, subscription_id, entity_type, entity_id, billing_period_start, billing_period_end,
resource_type, plan_limit, actual_count, overage_units, rate_ils_per_unit,
total_amount_ils, status ('pending' | 'invoiced' | 'waived'), notes,
created_at, updated_at
```
This is the single source of truth for all overage charges. One row per resource per billing period.

**New DB function: `calculate_overage_for_period`**
A stored function that, given a subscription, computes overage for a given month. Called by the snapshot job.

**New DB function: `snapshot_monthly_overages`**
A stored function that scans all active subscriptions, reads current counts, compares to plan limits, and writes/upserts rows into `overage_records`. Designed to be called monthly (or manually by admin).

---

### Layer 2: Logic Change — Allow Overages

Currently `useListingLimitCheck` sets `canCreate: false` when over limit, which hard-blocks the submit button. This needs to change:

- If the subscriber is **over limit**, `canCreate` becomes `true` (allowed with overage charge)
- A new flag `isOverLimit: boolean` is added so the UI can show the correct warning
- Same change for `useSeatLimitCheck` → `canInvite: true` with `isOverLimit`

The submit button **unlocks**. Instead, the `ListingLimitBanner` changes from a hard-block message to an **overage acceptance banner** that clearly states:

> "You're over your plan limit. This listing will be charged at ₪150/month as an overage. This will appear on your next statement."

With a checkbox the user must tick to confirm they accept the charge before the submit button activates.

---

### Layer 3: Overage Snapshot Hook (Backend Function)

New edge function: **`snapshot-overages`**

- Reads all `active` or `trialing` subscriptions
- For each: fetches current listing count, seat count, and project count
- Compares to plan limits
- Upserts into `overage_records` for the current billing period
- Called manually by admin OR automatically on a schedule

This is intentionally decoupled from payment (since PayPlus isn't integrated yet). It creates the record; billing happens separately.

---

### Layer 4: Admin UI — Overage Dashboard

New page section inside the existing **Admin → Settings** or a new **Admin → Billing** tab.

Displays:
- Table of all `overage_records` with status `pending`
- Columns: Account name, entity type, billing period, resource, over by, rate, total due
- Action buttons: "Mark as Invoiced", "Waive" (with notes field)
- Summary card: Total pending overage revenue across all accounts
- "Run Snapshot" button that calls the `snapshot-overages` edge function

---

### Layer 5: Billing Hub — Overage Transparency for Subscribers

On the `/agency/billing` and `/developer/billing` pages, inside the existing **Invoices** tab:

- New section **"Overage Charges"** (above invoice history)
- Shows a table of their own `overage_records` rows for the last 3 months
- Columns: Period, Resource, Units over, Rate, Estimated amount, Status
- If status is `pending`, shown with amber badge ("Pending — will appear on next statement")
- If status is `invoiced`, shown with green badge ("Invoiced")

---

### Layer 6: Usage Meters Enhancement

The existing `UsageMeters` component in the billing hub currently hides at 100%. It needs to show **overage** visually:

- Progress bar becomes red and shows `22/20 (+2 over)` when over limit
- Adds a line below: "Overage: 2 × ₪150 = ₪300 estimated this month"

---

## Files to Create

| File | Purpose |
|---|---|
| `supabase/functions/snapshot-overages/index.ts` | Edge function to compute and write overage records |
| `src/hooks/useOverageRecords.ts` | Hook to fetch subscriber's own overage records |
| `src/components/billing/OverageChargesTable.tsx` | Subscriber-facing overage history |
| `src/components/billing/OverageConsentBanner.tsx` | Replaces `ListingLimitBanner` when over limit |
| `src/pages/admin/AdminOverages.tsx` | Admin dashboard for all pending overages |

---

## Files to Modify

| File | Change |
|---|---|
| `src/hooks/useListingLimitCheck.ts` | Add `isOverLimit`, set `canCreate: true` when over limit (overage allowed) |
| `src/hooks/useSeatLimitCheck.ts` | Add `isOverLimit`, same logic |
| `src/components/billing/ListingLimitBanner.tsx` | Replace hard-block UI with consent-required overage banner |
| `src/components/billing/UsageMeters.tsx` | Show overage count + estimated charge when over limit |
| `src/pages/agency/AgencyBilling.tsx` | Add `OverageChargesTable` to Invoices tab |
| `src/pages/developer/DeveloperBilling.tsx` | Same |
| `src/pages/agent/NewPropertyWizard.tsx` | Pass consent state from banner to submit button |
| `src/pages/agent/EditPropertyWizard.tsx` | Same |
| `src/pages/developer/NewProjectWizard.tsx` | Same |
| `src/pages/developer/EditProjectWizard.tsx` | Same |

---

## Technical Notes

- Overage rates are stored in DB (`overage_rates` table), not hardcoded — admin controls them
- Snapshot function is idempotent (upserts, not inserts) — safe to run multiple times per month
- The consent checkbox on the banner stores acceptance in React state only (no DB record needed at this stage — it resets per session, which is intentional)
- PayPlus integration is a future step; `overage_records` with `status = 'pending'` serves as the queue for future billing runs
- No RLS bypass needed for subscriber-facing overage reads — rows are filtered by `entity_id` which matches the subscriber's own entity
- Admin view uses service role via edge function

---

## Migration SQL Summary

```sql
-- overage_rates table
CREATE TABLE public.overage_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  resource_type text NOT NULL,
  rate_ils numeric NOT NULL,
  effective_from date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed initial rates
INSERT INTO public.overage_rates (entity_type, resource_type, rate_ils) VALUES
  ('agency',    'listing', 150),
  ('agency',    'seat',    100),
  ('developer', 'project', 500);

-- overage_records table
CREATE TABLE public.overage_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  billing_period_start date NOT NULL,
  billing_period_end date NOT NULL,
  resource_type text NOT NULL,
  plan_limit integer NOT NULL,
  actual_count integer NOT NULL,
  overage_units integer GENERATED ALWAYS AS (GREATEST(0, actual_count - plan_limit)) STORED,
  rate_ils_per_unit numeric NOT NULL,
  total_amount_ils numeric GENERATED ALWAYS AS (GREATEST(0, actual_count - plan_limit) * rate_ils_per_unit) STORED,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_id, entity_type, resource_type, billing_period_start)
);

-- RLS
ALTER TABLE public.overage_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overage_records ENABLE ROW LEVEL SECURITY;

-- overage_rates: readable by all authenticated users (needed for display)
CREATE POLICY "overage_rates_read" ON public.overage_rates FOR SELECT TO authenticated USING (true);

-- overage_records: subscribers can only see their own
CREATE POLICY "overage_records_own_read" ON public.overage_records FOR SELECT TO authenticated
  USING (
    entity_id IN (
      SELECT id FROM public.agencies WHERE admin_user_id = auth.uid()
      UNION
      SELECT id FROM public.developers WHERE user_id = auth.uid()
    )
  );
```
