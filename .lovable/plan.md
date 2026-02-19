
# Buy More Credits Shortcut on Usage Meters

## What's Changing

The `UsageMeters` card currently shows plan usage (listings, seats, blog posts) with no credit context and no way to buy more credits without navigating away. The user has to find the Billing page, then click "Buy Credits", which is three clicks minimum.

The fix adds a **credit balance row with a "Buy More" button** directly at the bottom of the `UsageMeters` card — one click from the billing overview.

## Design

```text
┌──────────────────────────────────────────────────────┐
│  📊 Plan Usage                                        │
│                                                      │
│  Listings     ████████░░  12/20                      │
│  Team Seats   ████░░░░░░   3/5                       │
│  Blog Posts   ██████████  10/10  ← limit reached     │
│                                                      │
│  ─────────────────────────────────────────────────  │
│  ⚡ Credits   142              [Buy More Credits →]  │
└──────────────────────────────────────────────────────┘
```

The credit row is:
- Separated by a subtle `<Separator />` from the plan-limit meters (they're different resource types)
- Left side: `⚡ Credits` label + current balance number in `font-semibold`
- Right side: a compact `size="sm"` outline `Button` that links to `/{entityType}/credits` — the dedicated credit wallet page built in the previous session
- Only renders if the user has a subscription (`sub` is already gated earlier in the component)
- If the balance is zero, the credits number turns `text-destructive` to add urgency

## Implementation — One File

**`src/components/billing/UsageMeters.tsx`**

Changes:
1. Add imports: `Link` from `react-router-dom`, `Separator` from `@/components/ui/separator`, `Zap` and `ShoppingCart` from `lucide-react`, `Button` from `@/components/ui/button`
2. Pass `entityType` down to the card footer (already available as a prop)
3. After the existing `MeterRow` entries in `CardContent`, add a `<Separator />` and the credit row

The `creditBalance` value comes from `useSubscription()` which is already called (`const { data: sub } = useSubscription()`). `sub.creditBalance` is available — zero extra hooks, zero extra API calls.

The link target:
```typescript
const creditsPath = entityType === 'agency' ? '/agency/credits' : '/developer/credits';
```

This matches the exact pattern already used in `BillingSection.tsx`, `BoostDialog.tsx`, and `SubscriptionStatusCard.tsx`.

## Priority Ordering

The credit row only shows when `sub` is truthy (the existing `if (!sub || sub.status === 'none') return null` guard already handles this). No additional condition needed.

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/components/billing/UsageMeters.tsx` | Edit | Add separator + credit balance row with "Buy More Credits" button at bottom of card |

No new components. No route changes. No DB changes. One file, ~12 lines added.
