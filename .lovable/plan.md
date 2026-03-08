

## Problem

The net position comparison is inconsistent:

- **Buying net** = `equityBuilt` (just the asset value after exit costs — doesn't subtract what the buyer spent)
- **Renting net** = `investedSavingsValue - totalRentPaid` (subtracts all costs)

This makes buying look artificially better. A buyer who spent ₪2M+ in cash outflows shows ₪1.1M "net position" (just equity), while a renter who spent ₪900k in rent has that subtracted from their portfolio.

Additionally, the renter's monthly savings (when mortgage+ownership > rent) are NOT being invested — only the lump sum (down payment + purchase costs) is invested, missing a major component of the renting advantage.

## Plan

### 1. Fix the calculation logic (lines 340-400)

**a) Invest monthly savings for the renter:**  
When buying costs more than renting per month, the renter invests the difference monthly. Add a loop that compounds monthly savings at the investment return rate alongside the lump sum investment.

```
monthlySavings = totalMonthlyBuying - rent (adjusted yearly for rent increases)
investedMonthlySavings = sum of each month's savings compounded to end of period
```

**b) Make net positions consistent — both should be "what you walk away with":**
- `netBuyingWealth = equityBuilt` (unchanged — this IS what you get after selling)
- `netRentingWealth = investedSavingsValue + investedMonthlySavings` (portfolio value, NO rent subtraction — rent is cost of living, same as mortgage/ownership costs for the buyer)

The key insight: both sides have "cost of living" expenses (buyer: mortgage + ownership; renter: rent). Neither should be subtracted from the final asset position. The question is simply "what assets do you end up with?"

### 2. Update the breakdown display (lines 1086-1120)

- Show a "Monthly savings invested" line for the renter showing the compounded monthly difference
- Update "Total portfolio value" to include monthly savings investment
- Remove "Other renting costs" (the made-up 2% line)

### 3. Add tooltips to both "Net position" lines

- **Buying tooltip:** "Your equity if you sold the property today — property value minus remaining mortgage, selling costs, and applicable taxes. This is the cash you'd walk away with."
- **Renting tooltip:** "Your total investment portfolio — the down payment you invested instead of buying, plus monthly savings (the difference between ownership costs and rent), all compounded at {X}% annual return."

### 4. Expose new values from the calculation

Add to the returned calculations object:
- `monthlySavingsInvested` (total compounded value of monthly savings)
- `totalMonthlySavings` (raw monthly difference × months)

