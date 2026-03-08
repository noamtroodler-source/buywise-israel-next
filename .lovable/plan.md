

## Plan: Replace Loan Amount Input with Down Payment % Slider

**What changes:** Replace the "Loan amount" text input under "Include Mortgage Costs" with a down payment percentage slider that auto-calculates the loan amount from the property price.

### File: `src/components/tools/TrueCostCalculator.tsx`

**1. Replace state variable** (line ~200)
- Remove `loanAmount` state
- Add `downPaymentPercent` state (number, default derived from buyer category LTV)

**2. Add LTV lookup** (near line 358 where `ltvRate` is already calculated)
- Compute `minDownPaymentPercent` from buyer category: non_resident → 50%, additional → 30%, first_time/oleh → 25%
- Use this for slider min value and default

**3. Replace the UI** (lines 595–608) — the `{includeMortgageCosts && ...}` block becomes:
```
{includeMortgageCosts && (
  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
    <div className="flex items-center justify-between">
      <Label className="text-xs text-muted-foreground">Down payment</Label>
      <span className="text-sm font-medium">{downPaymentPercent}%</span>
    </div>
    <Slider
      value={[downPaymentPercent]}
      onValueChange={([v]) => setDownPaymentPercent(v)}
      min={minDownPaymentPercent}
      max={80}
      step={5}
      className="w-full"
    />
    <p className="text-xs text-muted-foreground">
      Loan: {formatPrice(loanAmount)} · Down: {formatPrice(downPaymentAmount)}
    </p>
  </div>
)}
```

**4. Derive loan amount** in the calculation memo:
- `downPaymentAmount = price * (downPaymentPercent / 100)`
- `derivedLoanAmount = price - downPaymentAmount`
- These display as helper text below the slider

**5. Update sessionStorage save/load** to use `downPaymentPercent` instead of `loanAmount`.

**6. Update the day-one cash insight** (line 358) to use the user's actual `downPaymentPercent` instead of the hardcoded `ltvRate`.

**7. Update reset** to set `downPaymentPercent` back to `minDownPaymentPercent`.

### Imports
- Add `Slider` from `@/components/ui/slider` (already in project)

