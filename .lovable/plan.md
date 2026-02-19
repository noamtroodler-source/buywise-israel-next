
# Dedicated Credit Wallet Pages — `/agency/credits` & `/developer/credits`

## What We're Building

Two new pages that consolidate everything credit-related into one place. Right now, credit information is scattered across Billing (balance + history), Boost Marketplace (spend), and AgencyBoost/DeveloperBoost (dedicated boost page). The credit wallet becomes the single destination for:

- **Credit balance** with expiry warnings
- **Transaction history** (existing `CreditHistoryTable`, already complete)
- **Buy credits** shortcut (links to `/pricing#credits`)
- **Expiry timeline** — visual breakdown of which credits expire when
- **Boost Marketplace** embedded inline — spend credits without leaving the page

The `/agency/boost` and `/developer/boost` pages already exist and can remain (they're linked from dashboards), but the new credits page gives them a richer home alongside balance and history.

---

## Page Layout

```text
/agency/credits (or /developer/credits)
┌─────────────────────────────────────────────────────────┐
│  ← Agency Dashboard    [Coins icon] Credit Wallet        │
├────────────────────────────┬────────────────────────────┤
│  BALANCE HERO CARD         │  EXPIRY TIMELINE CARD       │
│  ┌──────────────────────┐  │  ┌──────────────────────┐  │
│  │  🔢 142 credits      │  │  │ Expiry schedule      │  │
│  │  ≈ ₪2,840 value      │  │  │ • 50 expire Mar 31  │  │
│  │  [Buy Credits ↗]     │  │  │ • 92 expire Apr 30  │  │
│  └──────────────────────┘  │  └──────────────────────┘  │
├────────────────────────────┴────────────────────────────┤
│  TABS: [Transaction History]  [Spend Credits]            │
│                                                          │
│  Tab 1 → <CreditHistoryTable />  (already built)         │
│  Tab 2 → <BoostMarketplace />    (already built)         │
└─────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Step 1 — Create shared `CreditWallet` component

One component, used by both agency and developer pages: `src/components/billing/CreditWallet.tsx`

**Props**: `entityType: 'agency' | 'developer'`, `entityId: string | undefined`, `entityName: string`

**Sections**:

**A. Balance Hero Card**
- Uses `useSubscription()` for `creditBalance`
- Uses `useExpiringCredits()` for nearest expiry warning
- Large credit balance number + "≈ ₪X value" (creditBalance × 20)
- Amber warning if any credits expire within 30 days
- "Buy Credits" button linking to `/pricing#credits`
- "Boost Marketplace" tab scrolls down to the Marketplace section

**B. Expiry Timeline Card**
- Uses `useExpiringCredits(entityType, entityId)` — already returns grouped sorted data
- Renders a list of expiry groups: `• {amount} credits — expires {format(date, 'MMMM d, yyyy')} ({daysLeft} days)`
- Color-coded: red ≤7 days, amber ≤30 days, muted otherwise
- If no expiring credits: "All credits are non-expiring or you have no balance" in a muted state
- Empty state if balance = 0

**C. Tabbed Lower Section**

Tab 1 — **Transaction History**: renders `<CreditHistoryTable />` (zero changes to that component)

Tab 2 — **Spend Credits**: renders `<BoostMarketplace entityType={entityType} entityId={entityId} entityName={entityName} />` (zero changes to that component)

---

### Step 2 — Create `AgencyCredits` page

`src/pages/agency/AgencyCredits.tsx`

```
← Back to Agency Dashboard  |  [Coins] Credit Wallet
```

Uses `useMyAgency()` for entityId/name. Renders `<CreditWallet>`. Pattern matches `AgencyBoost.tsx` exactly.

---

### Step 3 — Create `DeveloperCredits` page

`src/pages/developer/DeveloperCredits.tsx`

Uses `useDeveloperProfile()` for entityId/name. Renders `<CreditWallet>`. Pattern matches `DeveloperBoost.tsx` exactly.

---

### Step 4 — Register routes in `App.tsx`

Add two lazy-loaded routes following the existing pattern:

```typescript
const AgencyCredits = lazy(() => import("./pages/agency/AgencyCredits"));
const DeveloperCredits = lazy(() => import("./pages/developer/DeveloperCredits"));

// In routes:
<Route path="/agency/credits" element={
  <ProtectedRoute><AgencyCredits /></ProtectedRoute>
} />
<Route path="/developer/credits" element={
  <ProtectedRoute requiredRole="developer"><DeveloperCredits /></ProtectedRoute>
} />
```

---

### Step 5 — Update entry points to link to the new page

Update "Buy Credits" links in **four existing components** to point to `/agency/credits` or `/developer/credits` instead of the generic `/pricing#credits`:

| Component | Current link | New behavior |
|---|---|---|
| `BoostMarketplace.tsx` | `billingPath` (billing page) | Change "Buy Credits" → `/agency/credits` or `/developer/credits` |
| `SubscriptionStatusCard.tsx` | `/pricing#credits` | Update to use entity-aware credits path |
| `BillingSection.tsx` | `/pricing#credits` | Update to use entity-aware credits path |
| `BoostDialog.tsx` | `/pricing#credits` | Update to use entity-aware credits path |

Since `SubscriptionStatusCard`, `BillingSection`, and `BoostDialog` all use `useSubscription()` internally, they can derive the entity type and build the path: `/${sub.entityType === 'agency' ? 'agency' : 'developer'}/credits`.

---

## Files Summary

| File | Type | Description |
|---|---|---|
| `src/components/billing/CreditWallet.tsx` | **New** | Shared wallet component — balance hero, expiry timeline, tabbed history + marketplace |
| `src/pages/agency/AgencyCredits.tsx` | **New** | Agency credits page wrapper |
| `src/pages/developer/DeveloperCredits.tsx` | **New** | Developer credits page wrapper |
| `src/App.tsx` | **Edit** | Add lazy imports + two new routes |
| `src/components/billing/BoostMarketplace.tsx` | **Edit** | "Buy Credits" → link to `/agency/credits` or `/developer/credits` |
| `src/components/billing/SubscriptionStatusCard.tsx` | **Edit** | "Buy Credits" → entity-aware credits path |
| `src/components/billing/BillingSection.tsx` | **Edit** | "Buy Credits" → entity-aware credits path |
| `src/components/billing/BoostDialog.tsx` | **Edit** | "Buy Credits" → entity-aware credits path |

---

## Technical Notes

- **Zero new hooks needed**: `useSubscription`, `useExpiringCredits`, `CreditHistoryTable`, and `BoostMarketplace` already exist and cover all data needs.
- **No DB changes**: purely a UI routing + composition change.
- **`useExpiringCredits`** already returns sorted groups with `{ expiresAt, amount }` — the expiry timeline is a straightforward `.map()` over that data.
- **Tab state**: the page uses a `defaultValue="history"` tab, with a `?tab=spend` query param supported via `useSearchParams` so the "Boost Marketplace" tab inside Billing can deep-link directly to the spend tab of the credits page.
- **"Buy Credits" links**: these currently point to `/pricing#credits` (the public pricing page). The new credits page is a better destination for authenticated professionals — it shows balance context and lets them buy without leaving the authenticated dashboard. The `/pricing#credits` external link can remain as a secondary path.
