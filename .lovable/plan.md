
# Credit Expiry Warning — Full Surfacing Plan

## Confirmed Gaps

### Gap 1 — `BoostMarketplace` header bar has no expiry info
The "X credits available" bar at the top of the Marketplace tab shows the balance and an ILS equivalent — but nothing about expiry. A user spending credits from the marketplace has no idea some or all of those credits expire tonight.

### Gap 2 — `BoostDialog` credit display has no expiry info
The compact credit balance row in the BoostDialog (used from listing and project row buttons) shows the number only. Same blind spot as the Marketplace.

### Gap 3 — `PricingFAQ` is factually incorrect
The FAQ says: *"Credits never expire unless otherwise noted."* The actual behavior is the opposite — credits from monthly subscription grants expire at end-of-month (confirmed in the DB trigger `grant_blog_approval_credits` which sets `expires_at` to end of current month). This needs to be corrected.

### Gap 4 — `CreditHistoryTable` rows with an `expires_at` don't highlight it
Positive transactions that have an `expires_at` set just show the date/amount with no visual cue that this is time-sensitive. A user reading their history can't quickly see which credits are about to expire.

### Gap 5 — No global "credits expiring soon" prompt outside billing
A user on any non-billing page with credits expiring in ≤ 7 days has zero visibility. The `BillingSection` (billing hub only) already shows this correctly — but only there.

---

## What's Already Working (Do Not Touch)
- `BillingSection.tsx` — `useExpiringCredits` is integrated, urgency logic for ≤ 7 days is implemented, amber `AlertTriangle` icon for urgent. ✅
- `useExpiringCredits` hook — correctly queries `credit_transactions` for positive amounts with `expires_at > now()`, groups by date. ✅

---

## Implementation

### Fix 1 — `BoostMarketplace`: add expiry line below the credit header bar

In the credit header bar section (`src/components/billing/BoostMarketplace.tsx`), after the "X credits available" line, add:
- Import `useExpiringCredits` and `differenceInDays` from `date-fns`
- Call `useExpiringCredits(sub?.entityType, sub?.entityId)` to get the first (most-urgent) expiry group
- If any credits expire within 30 days, show a single-line amber warning below the ILS equivalent: `"⚠ {amount} credits expire in {N} days (end of month)"` or `"⚠ All credits expire {date}"` for the urgent case (≤ 7 days: amber text, AlertTriangle icon; >7 days: muted clock icon)
- Only show the nearest-expiry group (the array is already sorted ascending so `[0]` is the most urgent)

### Fix 2 — `BoostDialog`: add expiry micro-line to the credit balance row

In `src/components/billing/BoostDialog.tsx`, the credit balance row is a simple flexbox. Extend it to show expiry info:
- Import `useExpiringCredits` and `differenceInDays`
- Call hook with `sub?.entityType, sub?.entityId`
- If expiring credits exist, show a secondary line below the balance number in amber/muted text: `"{N} expiring {date}"`
- This is small and non-intrusive, just enough to prompt awareness before they spend

### Fix 3 — `PricingFAQ`: fix the factually wrong credit expiry copy

Update the "How do credits work?" FAQ answer from:
> "Credits never expire unless otherwise noted."

To:
> "Credits from monthly plan grants expire at the end of the month they're issued. Purchased credit packages also expire at end of the month of purchase. Spend them before month-end to get full value — your balance is always visible in your billing hub."

This is accurate, sets expectations, and points users to the billing hub.

### Fix 4 — `CreditHistoryTable`: highlight expiry on credit-in rows

For positive transactions (`amount > 0`) that have an `expires_at` set, add a small amber chip below the transaction label showing the expiry date. Only show for credits that haven't expired yet (`expires_at > now()`). This makes the history table actionable rather than purely historical.

The chip reads: `"Expires {MMM d}"` — amber color, Clock icon, `text-xs`.

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/components/billing/BoostMarketplace.tsx` | Edit | Import `useExpiringCredits`, render amber expiry line below "credits available" in the header bar |
| `src/components/billing/BoostDialog.tsx` | Edit | Import `useExpiringCredits`, render expiry micro-text below credit balance number |
| `src/components/billing/PricingFAQ.tsx` | Edit | Fix factually wrong "credits never expire" copy to accurately describe end-of-month expiry |
| `src/components/billing/CreditHistoryTable.tsx` | Edit | Add amber "Expires {date}" chip on credit-in rows that have a future `expires_at` |

**No DB migration needed.** No new hooks needed — `useExpiringCredits` already exists and is correct.

---

## Technical Notes

- **`useExpiringCredits` already returns groups sorted ascending by `expiresAt`** — so `data?.[0]` is always the most urgent group. This is what to show in Marketplace and Dialog headers (most actionable info first).
- **The Marketplace and Dialog header only show the nearest group** to keep the UI tight. The full breakdown is already in `BillingSection` (billing hub).
- **`BillingSection` already has the complete multi-group expiry display** — it shows one line per expiry group with daysLeft calculation and urgency coloring. No changes needed there.
- **Days calculation:** `differenceInDays(new Date(group.expiresAt), new Date())` — same formula already used in `BillingSection`.
- **Urgency threshold:** ≤ 7 days = amber + AlertTriangle. > 7 days = muted foreground + Clock. This mirrors the existing `BillingSection` logic.
- **CreditHistoryTable expiry chip:** Only render when `txn.amount > 0` AND `txn.expires_at` is non-null AND `new Date(txn.expires_at) > new Date()` — i.e., credits still live. Expired credit rows don't need the chip (they already failed to help).
