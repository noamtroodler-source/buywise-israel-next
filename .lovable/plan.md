

# Enable Price Editing with Change Feedback in Agent Edit Wizard

## Current State
The price field already exists in the edit wizard (Step 1: Basics), and the database already has two triggers that automatically track price reductions (`original_price`, `price_reduced_at`). When an agent saves a price change, the triggers fire correctly.

**What's missing**: The agent has no visual feedback about the price change -- they can't see the current listed price vs. their new price, whether it constitutes a drop or increase, and what percentage change it represents.

## What Changes

### 1. Show Current Price Context in StepBasics (edit mode only)
When editing an existing property, display the current published price alongside the editable price field:
- Show "Current price: 2,500,000" above the input
- If the new price differs, show a live indicator: "Price drop: -5% (-125,000)" in green, or "Price increase: +3% (+75,000)" in amber
- If price goes back above `original_price`, note that the price drop badge will be cleared

### 2. Pass Edit Context into Wizard
The `PropertyWizardContext` needs a small addition to store the original (saved) price so StepBasics can compare against it. This is loaded from the property data in `EditPropertyWizard.tsx`.

## Files Changed

| File | Change |
|------|--------|
| `src/components/agent/wizard/PropertyWizardContext.tsx` | Add optional `savedPrice` field to wizard data for edit-mode comparison |
| `src/components/agent/wizard/steps/StepBasics.tsx` | Show current price and live change indicator when editing |
| `src/pages/agent/EditPropertyWizard.tsx` | Pass `savedPrice` when loading property data into wizard |

## Technical Details

**PropertyWizardContext.tsx**: Add `savedPrice?: number` to `PropertyWizardData`. This is only populated during edit, not new listings.

**StepBasics.tsx**: Below the price input, add a small info block:
```
Current listed price: 2,500,000
Your change: -125,000 (-5.0%) -- Price drop badge will appear
```
Uses simple math: `((newPrice - savedPrice) / savedPrice * 100)`. Only shown when `savedPrice` exists and differs from current input.

**EditPropertyWizard.tsx**: Set `savedPrice: property.price` in the `wizardData` object at line ~111.

No database changes needed -- the existing triggers handle all price drop tracking automatically.
