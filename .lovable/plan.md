
# Remove Payment Schedule from Project Cost Breakdown

## Overview
Remove the "Remaining Payment Schedule" section from the `ProjectCostBreakdown` component on project listing pages.

## Changes

### File: `src/components/project/ProjectCostBreakdown.tsx`

**1. Remove unused import**
- Remove `Calendar` from the lucide-react imports (line 2) since it's only used for the payment schedule header

**2. Remove unused variable**
- Delete the `remainingPaymentSchedule` array definition (lines 168-173)

**3. Remove the Payment Schedule JSX section**
- Delete the entire "Remaining Payment Schedule" section (lines 358-388)

## What Remains
After this change, the Cost Breakdown will contain:
- Header with Calculator icon
- PersonalizationHeader (buyer type + mortgage settings)
- Unit Type selector (ToggleGroup pills)
- "Due at Contract Signing" summary banner
- Collapsible breakdown details (First Payment, Purchase Tax, Lawyers, Other Fees)
- Buyer Protections section (Bank Guarantee, Warranty, etc.)

## Technical Details

The removal is clean with no side effects:
- The `remainingPaymentSchedule` variable is only used in the JSX being removed
- The `Calendar` icon import is only used for the section header being removed
- No other components depend on this section
