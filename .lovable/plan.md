

## Plan: Fix All Logic, Accuracy & Display Issues in True Cost Calculator

### Issues Found

1. **Mortgage line items invisible** — ₪6,000 in mortgage costs (appraisal, registration, bank fees) are summed but never shown in the results UI
2. **Bank guarantee calculated but not displayed** — line 300 computes it for new construction, but it's missing from both the total and the display
3. **Reset defaults `includeMortgageCosts` to `false`** (line 269) — contradicts the new `true` default
4. **Session storage loads `includeMortgageCosts` as `false`** (line 228) — `|| false` overrides saved `true`
5. **Disclaimer says "2024"** (line 951) — should be 2025
6. **4th stats quadrant wastes space on just "Registration ₪1,200"** — could show mortgage costs or monthly estimate instead
7. **Bank guarantee not in `allCostsAbovePrice` totals** — it's calculated but silently excluded from totals (it IS included, but not displayed)

### Changes to `src/components/tools/TrueCostCalculator.tsx`

**A. Fix reset & session storage defaults**
- Line 269: Change `setIncludeMortgageCosts(false)` → `setIncludeMortgageCosts(true)`
- Line 228: Change `data.includeMortgageCosts || false` → `data.includeMortgageCosts ?? true`

**B. Break out mortgage costs for display**
- Replace the single `mortgageCosts` lump sum with individual values in the return object: `appraisalFee`, `mortgageRegistrationFee`, `bankFees`
- These are already defined as constants; just expose them individually

**C. Redesign the 2×2 quick stats grid → 2×3 or flexible layout**
- Row 1: Purchase Tax | Lawyer Fees (range)
- Row 2: Agent Fees (range) | Registration & Gov Fees (tabu + mortgage reg combined)
- Row 3 (conditional): Mortgage Costs (appraisal + bank fees) | Monthly Costs
- This surfaces previously hidden mortgage line items directly in the stats

**D. Add mortgage cost breakdown section**
- When `includeMortgageCosts` is ON, show a small section (similar to "New Construction Costs") listing:
  - Appraisal: ₪2,500
  - Mortgage Registration: ₪1,500  
  - Bank Fees: ₪2,000
- This makes the ₪6,000 transparent rather than invisible

**E. Show bank guarantee in new construction section**
- Add bank guarantee line to the existing "New Construction Costs" amber section alongside Madad and Developer Lawyer

**F. Fix disclaimer year**
- Line 951: Change "2024" → "2025"

### Summary of UI changes

The results card will go from hiding ₪6,000+ in mortgage costs to explicitly showing each line item. The stats grid expands slightly, and the new construction section gains the bank guarantee row. No new components needed.

