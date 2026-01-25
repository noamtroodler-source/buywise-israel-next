
# Add Subtle "Example Values" Hint to Calculators

## Overview

Add a subtle, non-intrusive hint to all calculators indicating that the default values shown are examples. This helps set proper expectations without cluttering the interface.

---

## Approach

Create a small, reusable component that displays a subtle hint message at the top of the input section. The design will be:
- Very subtle (muted text, small font)
- Non-intrusive (doesn't take significant vertical space)
- Consistent across all calculators

---

## Design

```text
┌─────────────────────────────────────────────────┐
│ 💡 Example values shown — adjust for your case  │
└─────────────────────────────────────────────────┘
```

**Styling:**
- Text: `text-xs text-muted-foreground`
- Icon: Small lightbulb or info icon (optional)
- Placement: Top of the left column (inputs section), before the first Card
- Background: None or very subtle `bg-muted/30` with slight padding

---

## Implementation

### 1. Create New Component

Create `src/components/tools/shared/ExampleValuesHint.tsx`:

```tsx
import { Lightbulb } from 'lucide-react';

export function ExampleValuesHint() {
  return (
    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-3">
      <Lightbulb className="h-3 w-3 shrink-0" />
      <span>Example values shown — adjust for your situation</span>
    </p>
  );
}
```

### 2. Add to Shared Index

Update `src/components/tools/shared/index.ts` to export the new component.

### 3. Add to Each Calculator

Add the hint at the top of the `leftColumn` in each calculator that uses the standardized defaults:

| Calculator | Location |
|------------|----------|
| MortgageCalculator.tsx | Top of `leftColumn` div |
| AffordabilityCalculator.tsx | Top of `leftColumn` prop |
| PurchaseTaxCalculator.tsx | Top of left column |
| TrueCostCalculator.tsx | Top of `leftColumn` |
| RentVsBuyCalculator.tsx | Top of left column |
| InvestmentReturnCalculator.tsx | Top of left column |

**Not included:**
- RenovationCostEstimator (starts empty, user builds estimate)
- DocumentChecklistTool (checklist, not a calculator)

---

## Example Integration (MortgageCalculator)

Before:
```tsx
const leftColumn = (
  <div className="space-y-4">
    {/* Property Details Card */}
    <Card>
```

After:
```tsx
const leftColumn = (
  <div className="space-y-4">
    <ExampleValuesHint />
    {/* Property Details Card */}
    <Card>
```

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/tools/shared/ExampleValuesHint.tsx` | New file |
| `src/components/tools/shared/index.ts` | Add export |
| `src/components/tools/MortgageCalculator.tsx` | Add hint |
| `src/components/tools/AffordabilityCalculator.tsx` | Add hint |
| `src/components/tools/PurchaseTaxCalculator.tsx` | Add hint |
| `src/components/tools/TrueCostCalculator.tsx` | Add hint |
| `src/components/tools/RentVsBuyCalculator.tsx` | Add hint |
| `src/components/tools/InvestmentReturnCalculator.tsx` | Add hint |

---

## Result

Users will see a small, subtle message at the top of each calculator's input area reminding them that the pre-filled values are illustrative examples they should customize. This:

- Sets expectations without being intrusive
- Encourages engagement (users know to adjust)
- Matches the subtle, professional aesthetic of the tool design
