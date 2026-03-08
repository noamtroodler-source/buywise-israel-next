

## Plan: Show Maximum Loan as a Range

**What:** Change the "Maximum Loan" stat from a single value to a range (e.g., `$340k–$400k`), consistent with how Monthly Payment and Maximum Property Price already display ranges.

**How (single file change):**

In `src/components/tools/AffordabilityCalculator.tsx`:

1. **Add `maxLoanLow` and `maxLoanHigh` to the return object** (line ~300): Use the already-calculated `maxLoanAtHighRate` (low end — higher rate means smaller loan) and `maxLoanAtLowRate` (high end).

2. **Update the display** (line ~495): Replace `{formatPrice(calculations.maxLoanAmount)}` with `{formatCurrencyRange(calculations.maxLoanLow, calculations.maxLoanHigh, currencySymbol)}` — same pattern used by Monthly Payment on line 499.

That's it — two lines changed in one file. The math is already done.

