

## Audit Results: Rent vs Buy Calculator

### Critical Bug Found

**Mortgage term = time horizon (lines 309, 321)**

```
const years = timeHorizon;        // e.g. 10
const numPayments = years * 12;   // 120 months = 10-year mortgage
```

The calculator treats the comparison period as the mortgage term. If a user sets a 10-year horizon, it calculates a **10-year mortgage** instead of a standard 25-30 year one. This means:

- Monthly payments are ~2.5x too high (₪14k/month on a 10-year term vs ₪5.5k on a 25-year term)
- Remaining balance is always ₪0 (mortgage fully paid at horizon)
- Buying costs are massively overstated, skewing results heavily toward renting
- Break-even year is delayed artificially

**Fix:** Add a separate `mortgageTerm` input (default 25 years). Use it for payment calculation and amortization. Use `timeHorizon` only for the comparison snapshot — calculate remaining balance at year X of a 25-year mortgage.

### Secondary Issues

1. **Maintenance doesn't grow with appreciation (line 338):** `monthlyMaintenance = (price * 0.005) / 12` is fixed at purchase price. Should grow with property value each year since maintenance costs track property value.

2. **Break-even loop uses fixed `totalMonthlyBuying` (line 442):** The monthly savings calculation in the break-even loop uses the same `totalMonthlyBuying` for all 30 years, but rent increases yearly. After the mortgage term ends, the ownership cost drops dramatically (no mortgage), which isn't captured.

3. **`investmentGains` includes principal (line 410):** `investmentGains = lumpSumGains + monthlySavingsPortfolio` — the `monthlySavingsPortfolio` includes both the deposited savings AND their returns, so "investment gains" overstates pure gains. Minor display issue only.

4. **`monthlyEquityBuilding` is crude (line 471):** Fixed at 30% of mortgage payment. Not used in core calculations, just display, but misleading for long-term mortgages where principal portion grows significantly.

### Plan

1. **Add mortgage term input** — new dropdown (15/20/25/30 years, default 25), separate from time horizon. Recalculate `numPayments`, `monthlyMortgage`, and `remainingBalance` using mortgage term. Time horizon becomes the snapshot year only.

2. **Fix maintenance growth** — in the year loop, scale maintenance by `(1 + appreciationRate)^year` so it tracks property value.

3. **Fix break-even loop** — recalculate `totalMonthlyBuying` per year accounting for: (a) mortgage term (payments stop after term ends), (b) growing maintenance costs.

4. **Fix `investmentGains` display** — separate pure gains from principal contributions for accurate display.

5. **Clean up `monthlyEquityBuilding`** — calculate actual principal portion of current mortgage payment using amortization formula.

### Files Changed
- `src/components/tools/RentVsBuyCalculator.tsx` — all changes in this single file

