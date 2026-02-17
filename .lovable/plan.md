

# Phase F: Billing Dashboard

## Overview
Create dedicated billing dashboard pages for agents/agencies and developers that consolidate subscription info, usage meters, credit history, trial countdown, and contextual upgrade prompts into a single focused page.

## What Already Exists
- `BillingSection` component -- plan info, credit balance, expiring credits, manage billing portal, credit history
- `UsageMeters` component -- listings, seats, blog post progress bars
- `SubscriptionStatusCard` component -- compact plan status card
- `CreditHistoryTable` component -- transaction list
- `useSubscription` hook -- all subscription data including trial dates
- `useListingLimitCheck`, `useSeatLimitCheck`, `useBlogQuotaCheck` hooks -- usage data
- `useExpiringCredits` hook -- credit expiration breakdown

## Changes

### 1. Trial Countdown Banner
**New file**: `src/components/billing/TrialCountdownBanner.tsx`

A prominent banner shown when subscription status is `trialing`:
- Shows "X days left in your free trial" with a countdown
- Progress bar showing trial progress (elapsed vs total)
- CTA: "Choose a plan before your trial ends"
- Styled with primary gradient background, dismissible per session

### 2. Upgrade Prompt Card
**New file**: `src/components/billing/UpgradePromptCard.tsx`

Contextual upgrade suggestion shown when any usage metric exceeds 80%:
- Checks listing, seat, and blog usage percentages
- Shows the highest-usage resource: "You've used 18/20 listings (90%)"
- Suggests next tier with "Upgrade to [next plan] for more capacity"
- Link to /pricing

### 3. Billing Dashboard Page (Agency/Agent)
**New file**: `src/pages/agency/AgencyBilling.tsx`

Full billing page at `/agency/billing` with layout:
1. Trial countdown banner (if trialing)
2. Page header with back navigation
3. Two-column grid (desktop):
   - Left: Current plan card (from BillingSection), Usage meters
   - Right: Credit balance with expiration, Upgrade prompt (if >80% usage)
4. Full-width: Credit transaction history table
5. Action buttons: Manage Billing, Buy Credits, Change Plan

### 4. Billing Dashboard Page (Developer)
**New file**: `src/pages/developer/DeveloperBilling.tsx`

Same layout as agency billing but adapted for developer context:
- Shows "Projects" instead of "Listings"
- No seat meters (developers don't have teams)
- Same credit history, trial banner, upgrade prompts

### 5. Register Routes
**Modified file**: `src/App.tsx`

Add two new routes:
- `/agency/billing` -- protected, renders `AgencyBilling`
- `/developer/billing` -- protected with `requiredRole="developer"`, renders `DeveloperBilling`

### 6. Add Navigation Links
**Modified files**:
- `src/pages/agency/AgencyDashboard.tsx` -- add "Billing" link/button in the dashboard header area
- `src/pages/developer/DeveloperDashboard.tsx` -- add "Billing" link/button

## Technical Details

### Files Created
- `src/components/billing/TrialCountdownBanner.tsx`
- `src/components/billing/UpgradePromptCard.tsx`
- `src/pages/agency/AgencyBilling.tsx`
- `src/pages/developer/DeveloperBilling.tsx`

### Files Modified
- `src/App.tsx` -- add `/agency/billing` and `/developer/billing` routes with lazy imports
- `src/pages/agency/AgencyDashboard.tsx` -- add billing navigation link
- `src/pages/developer/DeveloperDashboard.tsx` -- add billing navigation link

### No Database Changes
All data is already available through existing hooks and tables.

### Component Composition
The billing pages will compose existing components rather than duplicating logic:
- `BillingSection` for plan info + credit balance + actions
- `UsageMeters` for usage progress bars
- `CreditHistoryTable` for transaction history
- `TrialCountdownBanner` (new) for trial status
- `UpgradePromptCard` (new) for contextual upgrade nudges

The trial banner calculates days remaining using `differenceInDays(trialEnd, now())` from the subscription data. The upgrade prompt checks `usagePercent` from the limit-check hooks and shows the suggestion when any metric exceeds 80%.

