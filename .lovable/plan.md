
# Add "Paid in Full" / No Mortgage Option

## Overview
This feature adds a "Pay in Full" (cash purchase) option across the mortgage-related components. When enabled, the cost breakdown will exclude mortgage-related fees and monthly payments, showing only the cash-relevant costs like purchase tax, lawyer fees, and property-related monthly costs.

## Current State
- The `MortgagePreferences` interface in `useMortgagePreferences.tsx` currently stores down payment and term preferences but has no flag for "no mortgage"
- Property cost breakdowns always assume a mortgage is involved
- The onboarding wizard (Step 6) goes straight into mortgage preference inputs
- The profile's Mortgage Section doesn't offer a way to indicate cash purchase

## Changes

### 1. Update MortgagePreferences Interface
**File**: `src/hooks/useMortgagePreferences.tsx`

Add an `include_mortgage` boolean field to the preferences:
```text
export interface MortgagePreferences {
  include_mortgage: boolean;  // NEW - true = mortgage, false = pay in full
  down_payment_percent: number | null;
  down_payment_amount: number | null;
  term_years: number;
  assumed_rate: number;
  monthly_income: number | null;
  income_type: 'net' | 'gross' | null;
}
```

Update the default preferences to set `include_mortgage: false` (cash-first baseline per the existing memory).

Add normalization logic to handle legacy data: if `include_mortgage` is undefined but mortgage settings exist, default to `true`.

### 2. Update Buyer Onboarding Wizard (Step 6)
**File**: `src/components/onboarding/BuyerOnboarding.tsx`

Add a RadioGroup at the start of Step 6 asking "How do you plan to pay?":
- **Option 1**: "Mortgage" - Shows existing mortgage preference fields
- **Option 2**: "Pay in Full / Cash" - Skips mortgage fields entirely

Visual layout:
```text
┌─────────────────────────────────────────┐
│ How do you plan to pay?                 │
├─────────────────────────────────────────┤
│ ○ Taking a mortgage                     │
│   I'll finance part of the purchase     │
│                                         │
│ ○ Paying in full / Cash                 │
│   I'm paying the full amount upfront    │
└─────────────────────────────────────────┘
```

When "Mortgage" is selected, show the existing down payment, term, and income inputs.
When "Cash" is selected, skip to the next step or show a simple confirmation.

### 3. Update Profile Mortgage Section
**File**: `src/components/profile/sections/MortgageSection.tsx`

Add a "Financing Method" toggle at the top of the section:
- A switch or segmented control: "Mortgage" / "Paid in Full"
- When "Paid in Full" is selected, hide mortgage-specific fields (down payment, term, income)
- Update the section title/status to reflect "Paid in Full" when applicable

Display states:
- **Mortgage mode**: Shows current behavior with editable down payment, term, income
- **Cash mode**: Shows "Paid in Full" badge, hides mortgage fields, status shows "Cash Purchase"

### 4. Update PersonalizationHeader
**File**: `src/components/property/PersonalizationHeader.tsx`

Update the header to show financing method:
- When `include_mortgage` is false, display "Calculating for: [Buyer Type] · Paid in Full"
- Add an option in the expanded panel to toggle between Mortgage and Cash
- When Cash is selected, hide the down payment and term controls

Updated header bar example:
```text
Calculating for: First-Time Buyer · Paid in Full  [Edit]
```

Expanded panel adds a financing method toggle before the mortgage scenario section.

### 5. Update PropertyCostBreakdown
**File**: `src/components/property/PropertyCostBreakdown.tsx`

Conditionally render costs based on `include_mortgage`:

**When mortgage is included (existing behavior)**:
- Upfront: Purchase tax, lawyer fees, agent fees, mortgage fees (appraisal, origination), registration
- Monthly: Mortgage payment + Arnona + Va'ad Bayit + Insurance

**When "Paid in Full" (new behavior)**:
- Upfront: Purchase tax, lawyer fees, agent fees, registration (exclude appraisal and mortgage origination)
- Monthly: Arnona + Va'ad Bayit + Insurance only (no mortgage payment row)

Key changes:
1. Get `include_mortgage` from `useMortgagePreferences()`
2. Conditionally exclude `mortgageFeesRange` from `totalOneTimeRange` when cash
3. In the monthly costs section, skip the Mortgage row and adjust the total display
4. Update the PersonalizationHeader to show "Paid in Full" instead of down payment/term

### 6. Update PropertyQuickSummary (Optional Enhancement)
**File**: `src/components/property/PropertyQuickSummary.tsx`

When `include_mortgage` is false:
- Hide the estimated monthly mortgage payment range
- Optionally show a "+ Add mortgage estimate" link to toggle financing mode

---

## Technical Details

### Normalization Layer in useMortgagePreferences
Add logic to normalize legacy preferences:
```typescript
function normalizePreferences(raw: any): MortgagePreferences {
  // If include_mortgage is undefined (legacy data), derive from existing settings
  if (raw?.include_mortgage === undefined) {
    // Has mortgage-specific settings? Assume they want mortgage
    const hasMortgageSettings = raw?.down_payment_percent || raw?.down_payment_amount || raw?.monthly_income;
    return {
      ...DEFAULT_PREFERENCES,
      ...raw,
      include_mortgage: hasMortgageSettings ? true : false, // Cash-first default
    };
  }
  return { ...DEFAULT_PREFERENCES, ...raw };
}
```

### Updated Fee Calculations
In `PropertyCostBreakdown.tsx`, split fees:
```typescript
// Always included
const baseFees = {
  low: registrationFeesRange.low,
  high: registrationFeesRange.high,
};

// Only when financing
const mortgageSpecificFees = includeMortgage ? {
  low: FEE_RANGES.appraisal.min + FEE_RANGES.mortgageOrigination.min,
  high: FEE_RANGES.appraisal.max + FEE_RANGES.mortgageOrigination.max,
} : { low: 0, high: 0 };
```

### UI Feedback
- Show a badge in the cost breakdown indicating "Cash Purchase" when no mortgage
- Monthly costs section title changes from "Estimated Monthly" to "Monthly Ownership Costs"
- Total monthly shows only Arnona + Va'ad Bayit + Insurance without mortgage payment

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useMortgagePreferences.tsx` | Add `include_mortgage` to interface, update defaults, add normalization |
| `src/components/onboarding/BuyerOnboarding.tsx` | Add financing method RadioGroup to Step 6 |
| `src/components/profile/sections/MortgageSection.tsx` | Add financing method switch, conditional field display |
| `src/components/property/PersonalizationHeader.tsx` | Show "Paid in Full" option, add toggle in expanded panel |
| `src/components/property/PropertyCostBreakdown.tsx` | Conditionally exclude mortgage fees and monthly payment |
| `src/components/property/PropertyQuickSummary.tsx` | Hide mortgage estimate when cash purchase |

## User Flow Summary

1. **New User Signup**: During onboarding Step 6, user chooses "Mortgage" or "Pay in Full"
2. **Profile Settings**: User can change financing method in Mortgage Preferences section
3. **Property Detail**: PersonalizationHeader shows current method, can be toggled inline
4. **Cost Breakdown**: Automatically adjusts to show relevant costs only
