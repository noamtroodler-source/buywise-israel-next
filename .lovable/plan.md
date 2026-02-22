

# Phase 4: Featured Listings Manager

## What We're Building

A new management screen where agency admins can see all their published listings and toggle "Featured" on/off for each one. Each featured listing costs 299/month. The screen shows a summary (active count, monthly total) and handles founding partner free credits.

## New Files

### 1. `src/hooks/useFeaturedListings.ts`
- **`useFeaturedListings(agencyId)`** -- queries `featured_listings` filtered by agency, returns active featured listings with joined property data (title, address, images)
- **`useFoundingPartnerStatus(agencyId)`** -- queries `founding_partners` and `founding_featured_credits` to check if agency is a founding partner and how many free credits remain this month
- **`useToggleFeaturedListing()`** -- mutation that:
  - **Feature ON**: inserts into `featured_listings` (sets `is_free_credit = true` if founding credit available, also increments `credits_used` on the founding credit row)
  - **Feature OFF**: updates `is_active = false` and sets `cancelled_at = now()`

### 2. `src/components/billing/FeaturedListingsManager.tsx`
- Summary card at top: "X Featured Listings -- Total: X299/mo" (excludes free-credit ones from cost)
- For founding partners: shows "Y free credits remaining this month"
- Table/list of all agency's published properties (from `useAgencyListingsManagement`)
- Each row shows: thumbnail, title, city, current status
- Toggle switch per row: "Featured -- 299/mo" or "Free Credit" if founding partner has credits
- Active featured listings show "Featured since [date]" and a cancel button
- Confirmation dialog before toggling on (to confirm billing) or off

### 3. `src/pages/agency/AgencyFeatured.tsx`
- Simple page wrapper with Layout, back button, heading
- Renders `FeaturedListingsManager` with the agency ID from `useMyAgency`

## Modified Files

### `src/App.tsx`
- Add route: `/agency/featured` pointing to `AgencyFeatured`

### `src/pages/agency/AgencyDashboard.tsx`
- Add a "Featured Listings" button in the header nav buttons (next to Billing, Analytics, etc.)
- Replace the existing "Homepage Listing Opportunities" card (lines 240-275) with a "Featured Listings" summary card showing active count and a link to `/agency/featured`

### `src/pages/agency/AgencyBilling.tsx`
- Add a "Featured Listings" tab (or summary section in Overview) showing active featured count + monthly cost with link to manage

## Rotation Logic (Display Surfaces)

The existing `useProperties.tsx` and `usePaginatedProperties.tsx` already query `featured_listings WHERE is_active = true` and set `_isBoosted = true`. The `PromotedBadge` component already renders on those. No changes needed for display -- the rotation is inherently session-based since featured properties are fetched fresh on each page load and placed at the top.

## Technical Details

- All queries use the existing Supabase typed client
- RLS is already configured: agency admins can CRUD their own rows, public can read active ones
- The partial unique index `(agency_id, property_id) WHERE is_active = true` prevents duplicate active features
- Founding credit tracking: when toggling on with a free credit, we update `founding_featured_credits.credits_used` via a separate update call
- No new DB migrations needed -- tables and policies already exist

