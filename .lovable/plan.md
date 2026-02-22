

# BuyWise Pricing Model Overhaul: Credits/Boosts Out, Featured Listings In

## Summary
Strip out the entire credit and boost system. Replace Engine 2 with a single "Featured Listing" product (ILS 299/month per listing) and add a Founding Partner program with free featured credits.

---

## Phase 1: Database — Drop Old Tables, Create New Ones

### Drop (migration)
- `active_boosts` table
- `visibility_products` table  
- `credit_transactions` table
- `credit_packages` table
- `overage_rates` table

### Drop DB Functions
- `get_credit_balance`
- `record_credit_purchase`
- `spend_credits`
- `get_active_boost_count`
- `enforce_boost_slot_cap`
- `grant_blog_approval_credits` (trigger on blog posts that granted credits)

### Create New Tables

**`featured_listings`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| agency_id | uuid FK agencies | Who owns it |
| property_id | uuid FK properties | Which listing |
| is_active | boolean default true | Currently featured? |
| is_free_credit | boolean default false | Paid via founding credit? |
| started_at | timestamptz default now() | |
| cancelled_at | timestamptz null | When agency toggled off |
| created_at | timestamptz | |

Unique constraint: `(agency_id, property_id)` when `is_active = true` (partial unique index).

**`founding_partners`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| agency_id | uuid FK agencies, unique | |
| option | text ('option_a' or 'option_b') | |
| discount_percent | numeric default 0 | 20 for Option A, 0 for Option B |
| discount_locked | boolean default false | true for Option A |
| free_credits_per_month | int default 3 | |
| free_credits_duration_months | int | 12 for A, 2 for B |
| started_at | timestamptz | |
| exclusivity_ends_at | timestamptz | 2 months from start |
| is_active | boolean default true | |
| notes | text null | Admin notes |
| created_at | timestamptz | |

**`founding_featured_credits`**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| founding_partner_id | uuid FK founding_partners | |
| month_number | int | 1, 2, 3... |
| credits_granted | int default 3 | |
| credits_used | int default 0 | |
| granted_at | timestamptz | |
| expires_at | timestamptz | End of that month |

### Update `subscription_plans` data
Update existing `membership_plans` rows to match the new pricing:
- Free: ILS 0, 5 listings, 1 seat, 0 blogs
- Starter: ILS 179, 20 listings, 3 seats, 2 blogs
- Growth: ILS 349, 50 listings, 8 seats, 4 blogs
- Pro: ILS 699, 120 listings, 20 seats, 6 blogs

### RLS Policies
- `featured_listings`: Agency members can read their own; public can read `is_active = true` for display
- `founding_partners`: Admin-only write; agency can read own
- `founding_featured_credits`: Admin-only write; agency can read own

---

## Phase 2: Delete Old Code

### Edge Functions to Delete
- `supabase/functions/activate-boost/` 
- `supabase/functions/stripe-credit-checkout/`
- `supabase/functions/snapshot-overages/`

### Hooks to Delete
- `src/hooks/useBoosts.ts`
- `src/hooks/useBoostAnalytics.ts`
- `src/hooks/useBoostedListings.ts`
- `src/hooks/useExpiringCredits.ts`
- `src/hooks/useOverageRecords.ts`

### Components to Delete
- `src/components/billing/BoostMarketplace.tsx`
- `src/components/billing/BoostAnalyticsPanel.tsx`
- `src/components/billing/BoostDialog.tsx`
- `src/components/billing/BoostProductCard.tsx`
- `src/components/billing/CreditWallet.tsx`
- `src/components/billing/CreditHistoryTable.tsx`
- `src/components/billing/CreditPackageCard.tsx`
- `src/components/billing/ActiveBoostBadge.tsx`
- `src/components/billing/OverageChargesTable.tsx`
- `src/components/billing/OverageConsentBanner.tsx`
- `src/components/billing/ListingPickerSheet.tsx`

### Pages to Delete
- `src/pages/agency/AgencyCredits.tsx`
- `src/pages/agency/AgencyBoost.tsx`
- `src/pages/developer/DeveloperCredits.tsx`
- `src/pages/developer/DeveloperBoost.tsx`

### Routes to Remove from App.tsx
- `/agency/credits`
- `/agency/boost`
- `/developer/credits`
- `/developer/boost`

---

## Phase 3: Update Existing Code (References Cleanup)

### `useSubscription.ts`
- Remove `creditBalance` field and `get_credit_balance` RPC call

### `useProperties.tsx` and `useProjects.tsx`
- Replace `visibility_products`/`active_boosts` boost-merging logic with a query to `featured_listings WHERE is_active = true` to get featured property IDs
- Keep `_isBoosted` flag on properties returned from featured_listings for badge display

### `useHomepageFeatured.tsx`
- This hooks into `homepage_featured_slots` (admin-curated) which is separate from the paid featured system. Keep as-is for admin curation. The new `featured_listings` table is the paid version.

### `PropertyCard.tsx`
- Keep `_isBoosted` / `PromotedBadge` logic but source it from `featured_listings` instead of `active_boosts`

### `AgentDashboard.tsx`
- Remove `ActiveBoostBadge` import and usage. Replace with a simple "Featured" badge reading from `featured_listings`

### `AgencyBilling.tsx` and `DeveloperBilling.tsx`
- Remove Boost ROI and Marketplace tabs
- Remove OverageChargesTable
- Simplify to 2 tabs: **Overview** and **Invoices**
- Add a "Featured Listings" section in the Overview tab showing active featured count and monthly cost

### `BillingSection.tsx`
- Remove "Buy Credits" button/link

### `SubscriptionStatusCard.tsx`
- Remove "Buy Credits" link

### `UsageMeters.tsx`
- Remove credits path references

### `FoundingMemberBanner.tsx`
- Replace credit schedule language with "3 free featured listings/month" language

### `CheckoutSuccess.tsx`
- Remove `isCredits` branch

### `AgentAnalytics.tsx`
- Remove `BoostAnalyticsPanel` import and tab

### `stripe-webhook/index.ts`
- Remove `credit_purchase` handling branch
- Remove promo credit grant logic (credit_schedule, credit_months_granted)

### `process-search-alerts/index.ts`
- Remove `visibility_products`/`active_boosts` sponsored email logic (or replace with `featured_listings` query)

### Navigation links across dashboards
- Remove links to `/agency/boost`, `/agency/credits`, `/developer/boost`, `/developer/credits`
- Add links to a new "Featured Listings" management section

---

## Phase 4: Build New Featured Listings UI

### New Component: `FeaturedListingsManager`
- Shows agency's current featured listings with toggle controls
- List of agency's published properties with a "Feature this listing - ILS 299/mo" toggle
- For founding partners: shows available free credits and "Use free credit" option
- Active featured listings show "Featured since [date]" and "Cancel" button

### New Hook: `useFeaturedListings.ts`
- Query `featured_listings` for the current agency
- Mutation to add/remove featured listings
- Query founding partner status and available credits

### Integration Points
- Homepage rotation: Query `featured_listings WHERE is_active = true`, randomize per session
- Search results: Featured listings get priority placement with "Featured" badge
- City pages, neighborhood pages, recommendations: Same rotation logic

---

## Phase 5: Founding Partner DB Setup

### Data insertion (not migration)
- Founding partners will be manually added via admin or direct DB insert
- Monthly credit grants handled by a cron edge function `grant-founding-credits` that:
  1. Finds active founding partners whose current month hasn't been granted
  2. Inserts a row into `founding_featured_credits`
  3. Credits expire at end of month (unused credits don't roll over)

---

## Phase 6: Payment Wiring (Future — Stub Now)

### Featured Listing Billing
- For now: featured listings are activated manually or via founding credits
- Future: Monthly aggregated invoice via PayPlus
  - Cron counts active non-free-credit featured listings per agency
  - Charges `count x ILS 299` monthly
- Payment method collection on founding partner signup (Option B needs card on file)

---

## Execution Order

1. **Phase 1** — Database migration (drop old + create new tables)
2. **Phase 2** — Delete old files (edge functions, hooks, components, pages)
3. **Phase 3** — Update all references in remaining code
4. **Phase 4** — Build FeaturedListingsManager UI
5. **Phase 5** — Founding partner data setup
6. **Phase 6** — Payment wiring (stub/placeholder)

This will be split across multiple implementation messages due to the scope. Phases 1-3 will be done first (cleanup), then Phases 4-6 (new features).

