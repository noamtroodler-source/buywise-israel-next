

## Calculator Bug Fixes

Seven bugs across the Mortgage, Affordability, and Tools router. All targeted, no architectural changes.

### 🔴 High

**1. Affordability "Max Loan" can exceed "Max Budget"**
File: `src/components/tools/AffordabilityCalculator.tsx` (calculations memo, ~lines 263–299)
- Root cause: `maxPropertyLow/High` are clamped against `maxPropertyFromLTV`, but `maxLoanLow/High` are the raw PTI-derived loan figures and aren't reconciled with the actual selected max property. At low incomes the loan headroom can exceed `maxProperty − downPayment`.
- Fix: derive `maxLoanLow/High` as `max(0, maxPropertyLow/High − downPayment)` so loan ≤ price − down payment by definition.

**2. Currency switch (USD) doesn't convert displayed result numbers**
Files: `src/components/tools/AffordabilityCalculator.tsx`, `src/components/tools/MortgageCalculator.tsx`
- Affordability: result card uses `formatCurrencyRange(...maxPropertyLow, maxPropertyHigh, currencySymbol)` and similar. Values are in ILS but symbol is `$`. Same for "Maximum Loan", "Monthly Payment", "Rate sensitivity", "Next step" link, save-prompt summary.
- Mortgage: `SaveResultsPrompt` line 793 passes ILS values with `currencySymbol`. Property-price input prefix is hardcoded `₪` (line 412) even when user prefers USD — should use `currencySymbol` like the down-payment field already does.
- Fix: wrap every result value passed to `formatCurrencyRange`/`formatPrice` in `toDisplay(...)` when the symbol is `currencySymbol`. Replace hardcoded `₪` prefix on the mortgage Property Price input with `currencySymbol` (and update the placeholder accordingly).

**3. User's interest rate ignored by Mortgage "Monthly Payment Range"**
File: `src/components/tools/MortgageCalculator.tsx` (lines 168–185, ~540–550)
- Root cause: `paymentRange` calls `estimateMonthlyPaymentRange(price, buyerType)` which hardcodes 4.5/5.25/6.0% and ignores `interestRate` and the user's actual `loanAmount`/`loanTermYears`.
- Fix: compute the hero range inline using `calculateMortgagePayment(loanAmount, rate, loanTermYears)` at three rates anchored on the user's input: `[max(rate−0.75, 2), rate, min(rate+0.75, 12)]`. Update the helper caption to read "Based on ±0.75% around your rate, {term}-year term". Keep `interestRange` consistent (already user-rate-aware after fix #4).

### 🟡 Medium

**4. Two different loan bases in one Mortgage view**
File: `src/components/tools/MortgageCalculator.tsx`
- Hero "Monthly Range" and "Interest Paid" should use the same loan base (the user's actual `loanAmount`, derived from their down payment), not max-LTV. Resolved by fix #3 above (both will use `loanAmount`).

**5. Affordability "Rate sensitivity" shows "drops by ~₪0"**
File: `src/components/tools/AffordabilityCalculator.tsx` (line ~514)
- Root cause: `stressedReduction / 2` rounds to 0 for small values; also when LTV is the binding constraint, both stressed and unstressed budgets equal `maxPropertyFromLTV`, so reduction is genuinely 0.
- Fix: compute a true +1% stressed budget separately (mirror the +2% block) instead of dividing by 2. When the result is below ~₪10k or LTV is the limiter, render a meaningful fallback: "Rate sensitivity: budget already capped by your down payment — rate changes don't affect it" (or an alternate message when income-bound and reduction is meaningfully zero).

**6. Affordability range collapses to single value but keeps "range" label**
Files: `src/components/tools/shared/ResultRange.tsx` (`formatCurrencyRange`), `src/components/tools/AffordabilityCalculator.tsx`
- `formatCurrencyRange` already collapses to one number when `low ≈ high`, but the surrounding labels still say "range".
- Fix: detect collapse via a small helper `isRangeDegenerate(low, high)` exported from `ResultRange.tsx`. In Affordability, swap the subtitle "Maximum property price range" → "Maximum property price" when degenerate, and equivalent for "Maximum Loan" / "Monthly Payment".

### 🟢 Low

**7. `/tools?tool=total-cost` silently shows index; title mismatch**
Files: `src/pages/Tools.tsx`, `src/components/tools/TrueCostCalculator.tsx`
- Add `'total-cost': TrueCostCalculator` alias to the `toolComponents` and `allTools` maps so both slugs resolve. Optionally normalize incoming param: if `tool === 'total-cost'`, transparently rewrite to `totalcost` to keep one canonical URL.
- Decide one name. The tool is referenced as "Total Cost Calculator" in nav cards and "True Cost Calculator" inside the tool. **Recommendation: keep "True Cost Calculator" everywhere** (matches the file name, page title, and existing memory `true-cost-calculator-v6`). Update `Tools.tsx` `allTools.totalcost.label` → "True Cost Calculator" and the description tagline. Leave the slug `totalcost` as canonical with `total-cost` as a working alias.

### Files Touched
- `src/components/tools/AffordabilityCalculator.tsx` — bugs 1, 2, 5, 6
- `src/components/tools/MortgageCalculator.tsx` — bugs 2, 3, 4
- `src/components/tools/shared/ResultRange.tsx` — bug 6 (export degenerate helper)
- `src/pages/Tools.tsx` — bug 7 (alias + label)

### Out of scope
- No DB changes, no edge functions, no new components.
- Other calculators (Investment, RentVsBuy, etc.) are not touched in this pass.

