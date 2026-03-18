

## Plan: Remove Purchase Tax Calculator and Fix All References

### What's Being Removed
The standalone **Purchase Tax Calculator** component (`PurchaseTaxCalculator.tsx`). This is redundant because the Total Cost Calculator already includes purchase tax calculations.

**Not being removed**: The Purchase Tax *Guide* (`/guides/purchase-tax`) — that's a full educational guide, not a calculator, and is actively linked from many places across the site.

**Not being removed**: The `purchaseTax.ts` utility library — it powers tax calculations inside the Total Cost, Rent vs Buy, and other calculators.

### Changes

**1. Delete file**
- `src/components/tools/PurchaseTaxCalculator.tsx`

**2. Update `src/App.tsx`** (line ~205)
- Change redirect from `/tools/purchase-tax-calculator` → `/tools?tool=totalcost` instead of `purchasetax`

**3. Update 3 guide files** — change "Purchase Tax Calculator" buttons to point to Total Cost Calculator:
- `src/pages/guides/OlehBuyerGuide.tsx` (line ~191): `/tools?tool=purchasetax` → `/tools?tool=totalcost`, update button label
- `src/pages/guides/NewConstructionGuide.tsx` (line ~301): same change
- `src/pages/guides/InvestmentPropertyGuide.tsx` (line ~683): same change

**4. Update saved results components** — redirect any saved `purchase_tax` results to Total Cost:
- `src/components/profile/SavedCalculatorResults.tsx`: change `purchase_tax` config path to `/tools?tool=totalcost`
- `src/components/profile/SavedCalculationsCompact.tsx`: change `purchase_tax` case to point to `/tools?tool=totalcost`

**5. Update `src/hooks/useSavedCalculatorResults.tsx`**
- Remove `purchase_tax` from the `CalculatorType` union (no new results will be saved under this type)

**6. Update `src/hooks/usePageContext.ts`**
- Remove `'purchase-tax'` from `toolNames` map (the guide entry stays)

### What stays untouched
- Purchase Tax Guide (`/guides/purchase-tax`) — fully functional educational content
- `src/lib/calculations/purchaseTax.ts` — used by Total Cost, Rent vs Buy, and other calculators
- `src/hooks/usePurchaseTaxBrackets.ts` — used by TrueCostWalkthrough
- `purchase_tax_brackets` database table — powers live tax calculations across multiple tools
- All links to `/guides/purchase-tax` remain valid

