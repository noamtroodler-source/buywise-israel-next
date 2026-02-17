

# Phase C: Overage Soft-Block System

## Overview
Enforce plan limits with clear messaging. When an agency or developer reaches their listing/seat limit, block the action and show exactly what the overage would cost, with an upgrade CTA. Also add usage meters to dashboards.

## Changes

### 1. Enhance `useListingLimitCheck` Hook
**File**: `src/hooks/useListingLimitCheck.ts`

Currently returns `{ canCreate, currentCount, maxListings, isLoading, needsSubscription }`. Enhance to also return:
- `nextTierName` -- the name of the next plan tier (for upgrade messaging)
- `overageMockPrice` -- a mock per-listing overage price for display (e.g., 150 ILS/listing/month for agencies, 500 ILS/project/month for developers)
- `usagePercent` -- for usage meter display

The mock overage prices are hardcoded constants since they aren't finalized. This makes the warning message clear: "Publishing additional listings would normally cost ~150 ILS/listing/month."

### 2. Create `useSeatLimitCheck` Hook
**New file**: `src/hooks/useSeatLimitCheck.ts`

Similar pattern to `useListingLimitCheck` but for team seats:
- Count current agents in the agency
- Compare against `maxSeats` from subscription
- Return `{ canInvite, currentSeats, maxSeats, isLoading, needsSubscription, overageMockPrice }`

### 3. Upgrade `ListingLimitBanner` with Overage Cost Warning
**File**: `src/components/billing/ListingLimitBanner.tsx`

When the user is at their limit, show:
- Current usage: "20/20 listings used"
- Overage cost warning: "Publishing additional listings would normally cost ~150 ILS/listing/month"
- Strong upgrade CTA: "Upgrade to Growth to unlock up to 50 listings"
- Style as a prominent warning (amber/yellow), not destructive red

### 4. Hard-Block Submit Button in Property/Project Wizards
**Files**:
- `src/pages/agent/NewPropertyWizard.tsx`
- `src/pages/developer/NewProjectWizard.tsx`

Import `useListingLimitCheck` directly into the wizard. When `canCreate` is false:
- Disable the "Submit for Review" button
- Add tooltip explaining why it's disabled
- Keep "Save as Draft" enabled (drafts don't count against limits)

Also update `EditPropertyWizard.tsx` and `EditProjectWizard.tsx` to block resubmission if at limit (for draft/rejected properties being resubmitted).

### 5. Seat Limit Enforcement on Agency Dashboard
**File**: `src/pages/agency/AgencyDashboard.tsx`

- Import `useSeatLimitCheck`
- When at seat limit, disable the "New Code" invite button
- Show warning: "You've used 5/5 team seats. Additional seats would cost ~100 ILS/seat/month. Upgrade to unlock more."

### 6. Usage Meters on Dashboards
**New component**: `src/components/billing/UsageMeters.tsx`

A compact card showing:
- Listings: "12/20 used" with progress bar
- Seats: "3/5 used" with progress bar
- Blog posts: "1/4 used this month" with progress bar

Color coding:
- Green: under 60%
- Amber: 60-90%
- Red: over 90% or at limit

Place this component on:
- `AgencyDashboard.tsx` -- near the subscription status card
- `DeveloperDashboard.tsx` -- near the subscription status card

### 7. Blog Quota in Usage Meters
Use the existing `useBlogQuotaCheck` hook (from Phase B) to feed into the usage meters component.

## Technical Details

### Files Created
- `src/hooks/useSeatLimitCheck.ts`
- `src/components/billing/UsageMeters.tsx`

### Files Modified
- `src/hooks/useListingLimitCheck.ts` -- add `nextTierName`, `overageMockPrice`, `usagePercent`
- `src/components/billing/ListingLimitBanner.tsx` -- add overage cost warning and upgrade messaging
- `src/pages/agent/NewPropertyWizard.tsx` -- hard-block submit when at limit
- `src/pages/developer/NewProjectWizard.tsx` -- hard-block submit when at limit
- `src/pages/agent/EditPropertyWizard.tsx` -- block resubmission when at limit
- `src/pages/developer/EditProjectWizard.tsx` -- block resubmission when at limit
- `src/pages/agency/AgencyDashboard.tsx` -- add seat limit check + usage meters
- `src/pages/developer/DeveloperDashboard.tsx` -- add usage meters

### No Database Changes Required
All data already exists in `membership_plans` (`max_listings`, `max_seats`, `max_blogs_per_month`). Mock overage prices are hardcoded constants.

### Mock Overage Prices (Hardcoded Constants)
These are display-only values for the warning messages. They will be updated when final overage pricing is decided:
- Agency extra listing: ~150 ILS/month
- Agency extra seat: ~100 ILS/month
- Developer extra project: ~500 ILS/month
- Developer extra seat: ~150 ILS/month

