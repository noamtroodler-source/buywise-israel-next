
# Invoice History Tab — Honest Empty State + Auth Fix

## What's Actually Happening

The Invoices tab is not broken due to a code bug — the plumbing is architecturally correct. The emptiness has three compounding reasons:

### Reason 1 — Zero subscribers in the database
The `subscriptions` table has no rows at all. `useSubscription` therefore always returns `status: 'none'` for every user, which means `hasSubscription` is false, and the query to fetch invoices is never even triggered. The user sees "Subscribe to a paid plan to see your invoice history" immediately.

### Reason 2 — Stripe hasn't processed any payments yet
Even if the `hasSubscription` gate passes, `list-invoices` looks up `stripe_customer_id` from the `subscriptions` row. That column is only populated by the `stripe-webhook` handler when a real `checkout.session.completed` event fires. No checkouts → no `stripe_customer_id` → `list-invoices` returns `[]`.

### Reason 3 — `list-invoices` uses a deprecated auth method
The edge function calls `supabase.auth.getClaims(token)` — this method does not exist in the current SDK version and will throw at runtime. Every other edge function in the project uses `supabase.auth.getUser(token)`. This would silently return a 401 if anyone did trigger the query.

## What We're Building

### Fix 1 — Patch the `list-invoices` auth call (critical, one-line)

Replace `supabase.auth.getClaims(token)` with `supabase.auth.getUser(token)` and update the null-check accordingly. This makes the function actually work when it does get called.

### Fix 2 — Smarter empty states in `InvoiceHistoryTable`

The current component has two empty states:
- "Subscribe to a paid plan" (when `!hasSubscription`)
- "No invoices yet" (when subscribed but no invoices returned)

Both are dead ends. Replace them with action-oriented states:

**State A — No subscription** (same as now but better CTA):
Keep the icon and text, but improve the primary CTA to link to `/pricing` with a "View Pricing" button.

**State B — Subscribed but no invoices yet** (new content):
This is the real gap. When a user has an active subscription but Stripe hasn't generated an invoice yet (e.g., they're in a trial, or the first billing cycle hasn't closed), show:
- "Your first invoice will appear here after your first billing cycle." 
- A "Manage Billing" button that opens the Stripe billing portal via the existing `manage-subscription` function — so they can download receipts or manage payment methods directly from Stripe while the invoice list is populating.

**State C — Has invoices** (no change, already renders correctly):
The existing invoice row rendering is correct — amount in ILS, status badge, PDF download. No changes needed.

### Fix 3 — Show "Manage Billing" shortcut in the subscribed-but-empty state

When `hasSubscription` is true but `data.length === 0`, add a "Manage Billing →" button that calls `manage-subscription` and opens the Stripe customer portal in a new tab. This gives subscribed users a direct path to their Stripe dashboard where historical receipts always live, regardless of what our `list-invoices` function returns.

This button already exists in `BillingSection.tsx` — we replicate the same `openBillingPortal` pattern inline in `InvoiceHistoryTable` for this one specific empty state.

## Files to Change

| File | Change |
|---|---|
| `supabase/functions/list-invoices/index.ts` | Replace `getClaims()` with `getUser()` — one-line fix so the function actually works at runtime |
| `src/components/billing/InvoiceHistoryTable.tsx` | Replace both empty states with action-oriented content; add Manage Billing button for subscribed-but-empty state |

No DB migration needed. No schema changes. No new hooks.

## Technical Notes

- **`getClaims` → `getUser` migration**: The old call was `supabase.auth.getClaims(token)` checking `data?.claims`. The replacement is `supabase.auth.getUser(token)` checking `data?.user`. The rest of the function logic is identical.
- **`manage-subscription` function**: Already deployed and working. Takes `{ entity_type, entity_id }` in the body, returns `{ url }` pointing to the Stripe customer portal. Called with `supabase.functions.invoke('manage-subscription', { body: {...} })`.
- **Invoice amounts**: Already correctly displayed as `₪{(inv.amount_paid / 100).toLocaleString()}` — Stripe stores amounts in agorot (cents), so dividing by 100 gives ILS. No change needed.
- **The Invoices tab will naturally populate** once real Stripe checkouts complete and the webhook writes `stripe_customer_id` to the subscriptions row. The fixes here ensure it works correctly when that happens.
- **No change to `OverageChargesTable`** — it already returns `null` when empty, which is correct (it's a bonus row, not a core feature of the tab).
