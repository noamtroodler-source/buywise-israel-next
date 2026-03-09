

# Investment Return Calculator -- Full Overhaul Plan

## Problems to Fix

### 1. Wrong Purchase Tax (Critical)
The calculator has a hardcoded fake tax function (lines 199-206) using 3.5%/5% brackets. Investment properties in Israel start at **8%**. Must reuse the existing `calculatePurchaseTax` from `src/lib/calculations/purchaseTax.ts` with `buyer_type = 'investor'`.

### 2. Missing Mortgage Interest Costs
When down payment < 100%, the remaining amount is financed -- but mortgage interest is completely ignored. This inflates ROI significantly. Need to add mortgage interest rate + term inputs and factor total interest paid into expenses.

### 3. Wrong ROI Formula
Currently: `annualReturn = netProfit / totalInvestment` (simple ratio over entire holding period, not annualized). Must use **CAGR**: `(endValue / startValue)^(1/years) - 1`.

### 4. "Annual Rent" Should Be "Monthly Rent"
Israeli market thinks in monthly rent. Change input to monthly, multiply by 12 internally. Default: ~6,500 (matches ₪80k/year).

### 5. No Vacancy Rate
Rent assumed at 100% occupancy. Add a vacancy % input (default 5%).

### 6. No Selling Costs
Exit costs (agent fee ~2%+VAT, capital gains tax 25% on appreciation) are missing. These massively affect net return.

### 7. Flat Expense Model
"Annual expenses %" is too crude. Replace with itemized defaults: Arnona, Vaad Bayit, insurance, maintenance -- pre-filled from existing `estimateAnnualExpenses()`.

### 8. Currency Formatting
Not using `useFormatPrice()` hook like all other calculators. Must adopt it for consistency and USD support.

### 9. Static Insights
Generic text instead of data-driven insights per the platform standard.

### 10. No Stock Market Benchmark
Should compare CAGR to a 7-8% stock market benchmark to contextualize the return.

---

## Implementation Plan

### A. Schema & Input Overhaul (`formSchema` + left column)
- Replace `annualRent` with `monthlyRent` (number, default 6500, label "Monthly Rent")
- Add `mortgageInterestRate` (number, default 4.5%, shown when downPayment < 100%)
- Add `mortgageTerm` (number, default 25 years, shown when downPayment < 100%)
- Add `vacancyRate` (number, default 5%)
- Replace `annualExpensesPercent` with itemized section: `arnona`, `vaadBayit`, `insurance`, `maintenancePercent` -- pre-filled from `estimateAnnualExpenses()` with a "Use defaults" toggle
- Add `buyerType` select (investor/first_time/oleh) to drive purchase tax
- Add `sellingAgentFee` toggle + percentage (default 2%)
- Remove the manual `taxRate` field -- replace with capital gains tax on appreciation (25% Israeli standard) as a toggle
- Make calculation **live** (remove Calculate button, use `useMemo` on form.watch())

### B. Calculation Engine Rewrite (inside component or new util)
- Import `calculatePurchaseTax` from `purchaseTax.ts` for accurate tax
- Compute mortgage: monthly payment, total interest over holding period
- Revenue = (monthlyRent * 12 * holdingPeriod * (1 - vacancyRate)) with 3% annual rent escalation
- Expenses = itemized annual costs with 2% annual escalation
- Selling costs = agent fee + capital gains tax (25% on appreciation)
- Total cash invested = down payment + purchase tax + buying agent fees + lawyer fees + renovation
- Net profit = total rent income + appreciation - total expenses - mortgage interest - selling costs - capital gains tax
- **CAGR** = `((totalCashInvested + netProfit) / totalCashInvested)^(1/years) - 1`
- Cash-on-cash return = year-1 net cash flow / total cash invested
- Gross yield = (monthlyRent * 12) / purchasePrice
- Net yield = (annual rent - annual expenses) / purchasePrice

### C. Results Panel Redesign (right column)
- **Hero metric**: CAGR percentage, large and prominent
- **Secondary metrics row**: Gross yield, Net yield, Cash-on-cash return, Total profit
- **Comparison badge**: "vs. 7% stock market benchmark" -- green if beating, amber if close, red if losing
- **Breakdown sections**:
  - Day-One Cash Required (down payment + all closing costs)
  - Annual Cash Flow (rent - expenses - mortgage payment)
  - Exit Summary (sale price, selling costs, capital gains tax, net proceeds)
  - Total P&L over holding period
- All amounts formatted with `useFormatPrice()`
- Add `₪` prefix labels on inputs via `useCurrencySymbol()`

### D. Data-Driven Insights
Generate insights array based on actual results:
- CAGR vs 7% benchmark comparison
- Vacancy impact (how much each 1% vacancy costs annually)
- Mortgage leverage effect (if leveraged, show how leverage amplifies/reduces returns)
- Break-even occupancy rate
- Cash-on-cash vs gross yield gap explanation

### E. Files Changed
1. **`src/components/tools/InvestmentReturnCalculator.tsx`** -- Full rewrite of inputs, calculation, results, and insights
2. No new utility files needed -- reuse existing `purchaseTax.ts` and `rentalYield.ts` functions

