

## Plan: Convert Single Values to Honest Ranges + Always Show Agent Fee

### Changes to `src/components/tools/TrueCostCalculator.tsx`

**1. Show Agent Fee toggle for ALL property types (not just resale)**
- Remove the `!isNewConstruction` condition wrapping the agent fee toggle (line 571)
- Default `includeAgentFee` to `true` regardless of property type
- Remove `!isNewConstruction` from the agent fee calculation (line 292) — just use the toggle

**2. Add min/max fee ranges to the calculations**
- Update `FEES` constants to include ranges:
  - `lawyerRate`: 0.005–0.01 (0.5–1%)
  - `agentRate`: 0.015–0.025 (1.5–2.5%)
  - `developerLawyerRate`: 0.01–0.02 (1–2%)
- Calculate both `lawyerFeeMin`/`lawyerFeeMax`, `agentFeeMin`/`agentFeeMax`, `developerLawyerFeeMin`/`developerLawyerFeeMax`
- For Madad: calculate with 2% low and 4% high annual rate instead of fixed 3%
- Monthly costs: use min/max from `calculateMonthlyCosts` (arnona varies, vaad bayit has a range)
- Compute `totalOneTimeMin`/`totalOneTimeMax` and `allCostsAbovePriceMin`/`allCostsAbovePriceMax`

**3. Update the results display to show ranges**

- **Total Cash Needed (hero)**: Show `₪X.XM – ₪X.XM` range
- **Lawyer Fees stat**: Show `₪Xk – ₪Xk`
- **Agent Fees stat**: Show range (1.5–2.5%) instead of single value or N/A
- **Developer Lawyer** (new construction): Show range
- **Index Linkage (Madad)**: Show range
- **Est. Monthly Costs**: Show `₪X,XXX – ₪X,XXX/mo`
- **Registration**: Keep as single value (fixed government fee)
- **Purchase Tax**: Keep as single value (formula-determined)

- The "+X above list price" subtitle under the hero will also become a range

**4. Update insights to reference ranges**

Adjust the day-one cash insight to use the range format.

### Technical Details

All changes are isolated to `TrueCostCalculator.tsx`. The existing `ResultRange` component and `formatPriceRange` utilities exist but won't be used here to avoid over-engineering — we'll format inline since the results panel has its own layout. The `formatPrice` hook will be used for each end of the range with an en-dash separator.

