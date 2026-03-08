

## Fix: Remove shared occupant costs from rent-vs-buy comparison

### The Bug
Arnona (~₪400/mo) and Vaad Bayit (~₪350/mo) are included in buying costs but not renting costs. Both renters and buyers pay these, so they cancel out and should be excluded from the differential calculation.

### Changes (single file: `src/components/tools/RentVsBuyCalculator.tsx`)

1. **Split ownership costs into two categories:**
   - `getSharedOccupantCost()` — arnona + vaad bayit (paid by both renters and buyers)
   - `getOwnerOnlyCost(year)` — insurance + maintenance (buyer-only, maintenance grows with appreciation)

2. **Update `getMonthlyBuyingCost(year)`** to use only owner-specific costs: `mortgage + insurance + maintenance` (no arnona/vaad)

3. **Update `totalMonthlyBuying` display** to exclude shared costs, so the "Monthly if Buying" vs "Monthly if Renting" comparison is apples-to-apples

4. **Update the monthly savings loop** — the saving = `(mortgage + owner-only costs) - rent` instead of `(mortgage + all costs) - rent`

5. **Add a note/line in the output section** clarifying that arnona and vaad bayit apply to both scenarios and are excluded from the comparison

This will make buying look relatively better (which is more accurate), since ~₪750/month is removed from the buying-only column.

