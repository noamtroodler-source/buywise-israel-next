
# Phase E: Billing Dashboard — Gap Analysis & Implementation Plan

## What Already Exists

The billing pages (`/agency/billing`, `/developer/billing`) already include:
- `BillingSection` — current plan, credit balance with expiring credit warnings, action buttons (Change Plan, Buy Credits, Manage Billing portal)
- `CreditHistoryTable` — last 50 credit transactions from the DB ledger
- `UsageMeters` — listings/seats/blogs progress bars
- `TrialCountdownBanner` — animated countdown with progress
- `UpgradePromptCard` — appears when usage ≥ 80%
- `BoostAnalyticsPanel` — boost ROI chart and performance table (exists but not wired into the billing pages)

## What's Missing (Phase E Gaps)

### Gap 1 — Stripe Invoice History
There is no invoice/payment history component. Users cannot see past payments. A new edge function `list-invoices` is needed to call `stripe.invoices.list({ customer })` and return a lightweight list. The UI component renders this as a table with: date, description (plan name), amount, status badge, and a "Download PDF" icon link.

### Gap 2 — Boost Analytics Not Surfaced on Billing Pages
`BoostAnalyticsPanel` and `useBoostAnalytics` exist and are fully implemented, but the billing page layout only shows Usage Meters and UpgradePromptCard in the right column. The Boost analytics tab should be surfaced here so professionals can see their credit ROI directly on the billing page.

### Gap 3 — Billing Page Layout is a Static Two-Column Grid
The current layout has no tabs — it just stacks all cards. A tabbed layout (Overview / Invoices / Boost Analytics) would make the page scannable and prevent the right column from becoming very long.

### Gap 4 — No "Billing Cycle" Indicator in BillingSection
`BillingSection` shows the plan name and next billing date, but not whether the user is on monthly or annual billing. Displaying this lets users know their current commitment.

### Gap 5 — CreditHistoryTable has No Pagination / Filter
Currently shows the last 50 transactions with no way to filter by type (purchases only, spends only) or load more. A simple type filter and "Load more" button improves usability.

## Files to Create

| File | Purpose |
|---|---|
| `supabase/functions/list-invoices/index.ts` | New edge function: fetches Stripe invoices for the entity's stripe_customer_id |
| `src/components/billing/InvoiceHistoryTable.tsx` | New component: renders invoice list fetched from the edge function |

## Files to Modify

| File | Change |
|---|---|
| `src/pages/agency/AgencyBilling.tsx` | Wrap content in a 3-tab layout (Overview / Invoices / Boost Analytics) |
| `src/pages/developer/DeveloperBilling.tsx` | Same tabbed layout |
| `src/components/billing/BillingSection.tsx` | Add billing cycle pill; tighten existing layout |
| `src/components/billing/CreditHistoryTable.tsx` | Add type filter dropdown + "Load more" (offset-based) |

## Implementation Details

### Edge Function: `list-invoices`

Authenticates the caller, looks up `stripe_customer_id` from the `subscriptions` table (same pattern as `manage-subscription`), then calls:

```typescript
stripe.invoices.list({ customer: customerId, limit: 20 })
```

Returns a minimal array per invoice:
```typescript
{
  id: string,
  number: string,
  created: number,          // Unix timestamp
  amount_paid: number,      // in agorot (×0.01 to get ₪)
  currency: string,
  status: string,           // 'paid' | 'open' | 'void' | 'uncollectible'
  description: string,      // subscription line item description
  invoice_pdf: string | null
}
```

No new DB table needed — data comes from Stripe directly.

### Component: `InvoiceHistoryTable`

Calls the edge function via `supabase.functions.invoke('list-invoices', { body: { entity_type, entity_id } })`. Renders:

- A table row per invoice with: date, description, amount in ₪, a `Badge` for status, and a download icon linking to `invoice_pdf`
- Loading skeleton (3 rows)
- "No invoices yet" empty state when on Free plan or no Stripe customer exists
- Only shown when `hasSubscription` is true (Free plan users see a friendly "Subscribe to see invoice history")

### Tabbed Layout on Billing Pages

Using the existing `Tabs` component from `@radix-ui/react-tabs` (already installed via shadcn):

```
Tab 1: Overview     → existing two-column layout (BillingSection + UsageMeters + UpgradePromptCard)
Tab 2: Invoices     → full-width InvoiceHistoryTable
Tab 3: Boost ROI    → full-width BoostAnalyticsPanel (already built, just needs wiring)
```

The tab header sits between the page header and the content area, replacing the existing `grid gap-6 lg:grid-cols-2` wrapper.

### BillingSection — Billing Cycle Pill

Inside the "Current Plan" block, alongside the status badge, add a secondary pill showing billing cycle:

```tsx
{sub.billingCycle && (
  <Badge variant="outline" className="text-xs">
    {sub.billingCycle === 'annual' ? 'Annual billing' : 'Monthly billing'}
  </Badge>
)}
```

### CreditHistoryTable — Filter + Load More

Add a `useState` for `typeFilter: 'all' | 'purchase' | 'spend' | 'bonus' | 'subscription_grant'` and a `limit` state starting at 20, incrementing by 20 on "Load more". The Supabase query conditionally adds `.eq('transaction_type', typeFilter)` when filter is not `'all'`.

## No Schema Changes
All new data comes from Stripe (invoices) or already exists in `credit_transactions`. No migrations needed.

## Execution Order
1. Create `list-invoices` edge function
2. Create `InvoiceHistoryTable` component
3. Update `AgencyBilling` and `DeveloperBilling` to use tabbed layout
4. Update `BillingSection` to show billing cycle
5. Update `CreditHistoryTable` with filter + load more
