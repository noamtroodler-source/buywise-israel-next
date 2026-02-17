
# Phase 4: Enforcement, Boost Activation, and Credit Spending

## Overview
Phase 3 built the UI for subscribing and buying credits. Phase 4 makes these purchases *matter* by enforcing listing limits, enabling boost activation (spending credits), and showing active boosts.

## What Gets Built

### 1. Listing Limit Enforcement
When an agent or developer tries to create a new listing/project, check their subscription's `max_listings` against their current count. If they've hit the limit, show an upgrade prompt instead of allowing creation.

**Where it applies:**
- Agent: `useCreateProperty` hook in `src/hooks/useAgentProperties.tsx` -- before inserting, count current non-draft properties vs `maxListings`
- Developer: `useCreateProject` hook in `src/hooks/useDeveloperProjects.tsx` -- same pattern
- UI gates in `NewProperty.tsx` and `NewPropertyWizard.tsx` -- show a banner/modal when limit reached

**New hook:** `useListingLimitCheck` -- returns `{ canCreate, currentCount, maxListings, isLoading }` by combining the subscription data with a count query.

### 2. Boost Activation Edge Function
A new edge function `activate-boost` that:
- Accepts `{ product_slug, target_type, target_id }` (e.g., "homepage_sale_featured" for a specific property)
- Validates the user owns the target listing/project
- Checks credit balance is sufficient (via `get_credit_balance` RPC)
- Checks slot availability (via `get_active_boost_count`)
- Deducts credits using `record_credit_purchase` (negative amount)
- Creates an `active_boosts` row with calculated `starts_at` / `ends_at`
- Returns the created boost details

### 3. Boost Activation UI
A "Boost Listing" dialog/modal accessible from the agent's property card or developer's project card in their dashboards.

**Components:**
- `BoostDialog.tsx` -- modal showing available boost products, credit costs, current balance, and a confirm button
- `ActiveBoostsDisplay.tsx` -- small badges/indicators on listing cards showing active boosts
- `BoostHistorySection.tsx` -- table in settings showing past and active boosts

### 4. Credit Transaction History
A "Credit History" section in the billing/settings area showing:
- All credit transactions (purchases, spending, expiring)
- Running balance
- Filterable by date range

### 5. Blog Post Limit Enforcement
Similar to listing limits, check `max_blogs_per_month` before allowing a new blog post submission.

---

## Technical Details

### Listing Limit Check Hook (`useListingLimitCheck`)
```text
- Uses useSubscription() for maxListings
- Queries property/project count for the entity (non-draft only)
- Returns { canCreate, currentCount, maxListings }
- If maxListings is null (Enterprise), canCreate is always true
- If no subscription, maxListings defaults to 0 (must subscribe)
```

### activate-boost Edge Function
```text
Path: supabase/functions/activate-boost/index.ts
Auth: Bearer token required
Method: POST
Body: { product_slug: string, target_type: 'property' | 'project', target_id: string }

Steps:
1. Authenticate user, resolve entity (agency/developer)
2. Verify ownership of target listing
3. Fetch visibility_product by slug
4. Check applies_to matches entity_type
5. Check credit balance >= credit_cost
6. Check slot availability if max_slots is set
7. Call record_credit_purchase with negative amount
8. Insert active_boosts row
9. Return boost details
```

### Database Changes
- New RPC function `spend_credits` (similar to `record_credit_purchase` but validates balance >= amount)
- RLS policies on `active_boosts` for entity owners to SELECT their own boosts
- RLS policies on `credit_transactions` for entity owners to SELECT their own transactions

### File Structure
```text
src/
  hooks/
    useListingLimitCheck.ts     -- Listing limit enforcement hook
    useBoosts.ts                -- Fetch active boosts, available products
  components/
    billing/
      BoostDialog.tsx           -- Boost activation modal
      ActiveBoostBadge.tsx      -- Badge showing active boost on listing
      CreditHistoryTable.tsx    -- Credit transaction history table

supabase/
  functions/
    activate-boost/index.ts     -- Boost activation edge function
```

### UI Integration Points
- Agent property cards: Add "Boost" button + ActiveBoostBadge
- Developer project cards: Add "Boost" button + ActiveBoostBadge
- New Property / New Project pages: Show limit warning banner
- Settings billing tab: Add CreditHistoryTable
- useCreateProperty / useCreateProject: Add pre-check guard

### Enforcement Flow
```text
User clicks "Add New Listing"
  --> useListingLimitCheck fires
  --> If canCreate = false:
      Show modal: "You've reached your plan's limit of X listings.
                   Upgrade to [next tier] for more."
      CTA: "Upgrade Plan" (links to /pricing)
  --> If canCreate = true:
      Proceed normally to wizard/form
```

### Boost Activation Flow
```text
User clicks "Boost" on a listing
  --> BoostDialog opens
  --> Fetches visibility_products filtered by entity type
  --> Shows products with credit cost, duration, slot availability
  --> User selects a boost product and confirms
  --> Calls supabase.functions.invoke('activate-boost', { ... })
  --> On success: toast + refresh active boosts
  --> On failure: show error (insufficient credits / no slots)
```

## What Is NOT in Phase 4
- Homepage/search result rendering of boosted listings (Phase 5 -- query-side integration)
- Email digest sponsored slot rendering (Phase 5)
- Admin boost management/override (Phase 5)
