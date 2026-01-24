
# Enhance Project Cost Breakdown with "At Signing" Clarity

## Problem
The current cost breakdown shows "Upfront Costs" as a lump sum (₪82k–115k fees), but doesn't connect this to the staged payment schedule. In new construction, buyers need to know what's actually due at **contract signing**:

- **10% of purchase price** (e.g., ₪185,000)
- **Plus fees** (Purchase Tax, Lawyer, Developer Lawyer, etc.)

The current UX separates these into two disconnected sections, making it unclear what the buyer actually needs to bring to the table on Day 1.

## Solution
Restructure the upfront costs section to show:
1. **"Due at Signing"** - Clear total combining the 10% payment + all upfront fees
2. **"Remaining Payments"** - The staged 15% + 25% + 50% milestones
3. Optional: A summary card at the top showing "To get started: ~₪200k–300k" (first payment + fees)

## Visual Design (Proposed)

```text
💰 Cost Breakdown

Calculating for: First-Time Buyer · Paid in Full  [Edit ▾]

Unit Type: [ 3-Room ][ 4-Room ][ Penthouse ]
           ₪1.85M · 3-Room Apartment

┌─────────────────────────────────────────────────────────────┐
│ 📋 DUE AT CONTRACT SIGNING                                  │
│                                                             │
│   First Payment (10%)                      ₪185,000         │
│   Purchase Tax (First-Time)                ₪12,890          │
│   Your Lawyer (0.5–1% + VAT)               ₪10.9k–21.8k     │
│   Developer Lawyer (1–2% + VAT)            ₪18.5k–37k       │
│   Registration & Other                     ₪400–600         │
│   ───────────────────────────────────────────────────       │
│   Total to Get Started                     ₪227k–257k       │
└─────────────────────────────────────────────────────────────┘

📅 Remaining Payment Schedule
   ┌──────┐
   │ 15%  │ Foundation Complete      ₪277,500
   ├──────┤
   │ 25%  │ Structure Complete       ₪462,500
   ├──────┤
   │ 50%  │ Key Delivery             ₪925,000
   └──────┘
   (If financing, mortgage typically covers this stage)

🛡️ Buyer Protections
   ✓ Bank Guarantee  ✓ 1-Year Warranty  ✓ Staged Payments
```

## Technical Changes

### File: `src/components/project/ProjectCostBreakdown.tsx`

**1. Calculate "Due at Signing" Total**
Combine the first payment (10%) with all upfront fees:
```tsx
const firstPaymentPercent = paymentSchedule[0].percent; // 10%
const firstPaymentAmount = price * (firstPaymentPercent / 100);

// Due at signing = first payment + all upfront fees
const dueAtSigningRange = {
  low: firstPaymentAmount + totalUpfrontRange.low,
  high: firstPaymentAmount + totalUpfrontRange.high,
};
```

**2. Restructure the Upfront Costs Section**
- Rename from "Upfront Costs" to "Due at Contract Signing"
- Add the First Payment (10%) as the first line item
- Show a clear total that includes both the payment + fees
- Keep the collapsible pattern but make the expanded view default for clarity

**3. Update Payment Schedule Section**
- Rename to "Remaining Payment Schedule"
- Remove the 10% milestone (it's now shown in "Due at Signing")
- Add a note about when mortgage kicks in (typically at Key Delivery)

**4. Add a Summary Banner (Optional)**
At the top, show a quick summary:
```tsx
<div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-muted-foreground">To get started</p>
      <p className="text-lg font-bold text-primary">
        {formatPriceRange(dueAtSigningRange.low, dueAtSigningRange.high, 'ILS')}
      </p>
    </div>
    <div className="text-right text-xs text-muted-foreground">
      <p>10% down + fees</p>
      <p>~{((dueAtSigningRange.low / price) * 100).toFixed(0)}–{((dueAtSigningRange.high / price) * 100).toFixed(0)}% of price</p>
    </div>
  </div>
</div>
```

**5. Handle Mortgage Scenario**
When "Include Mortgage" is ON:
- Add context that mortgage typically covers the 50% Key Delivery payment
- Show mortgage monthly payment estimate in the Key Delivery milestone
- Add mortgage-related fees (appraisal, origination) to upfront costs

## Line Item Changes

### Before:
- Upfront Costs: ₪82k–115k (~5.2–6.8%)
  - Purchase Tax
  - Your Lawyer
  - Developer Lawyer
  - Other Fees

- Payment Schedule: 10% → 15% → 25% → 50%

### After:
- **Due at Signing**: ₪227k–257k (~14–16%)
  - First Payment (10%): ₪185,000
  - Purchase Tax: ₪12,890
  - Your Lawyer: ₪10.9k–21.8k
  - Developer Lawyer: ₪18.5k–37k
  - Registration: ₪400–600

- **Remaining Milestones**: 15% → 25% → 50%
  - Foundation: ₪277,500
  - Structure: ₪462,500  
  - Key Delivery: ₪925,000 (mortgage kicks in here)

## Files to Modify

1. **`src/components/project/ProjectCostBreakdown.tsx`** - Complete restructure of sections

## What This Achieves

- **Clearer user expectation**: "I need ~₪250k to get started" vs. two separate numbers
- **Aligns with reality**: New construction buyers pay 10% + fees at signing
- **Honest ranges maintained**: All fee estimates remain as ranges
- **Mortgage context**: When financing, clarifies that mortgage covers later stages
- **Preserves buyer protections**: Section remains unchanged
