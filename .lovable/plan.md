

# Remove "Calculated for Israel" Badge from All Calculators

The "Data Sources & Verification" dropdown (SourceAttribution) already communicates the same trust signal with more specificity. The inline badge is redundant.

## Changes

Remove the "Calculated for Israel" inline badge from these 7 files:

1. **AffordabilityCalculator.tsx** — Remove the `BadgeCheck` line (~line 566)
2. **MortgageCalculator.tsx** — Remove the `BadgeCheck` block (~lines 774-780)
3. **TrueCostCalculator.tsx** — Remove the `BadgeCheck` block (~lines 1017-1023)
4. **RentVsBuyCalculator.tsx** — Remove the badge div (~lines 968-970)
5. **InvestmentReturnCalculator.tsx** — Remove the badge from the flex container (~lines 271-273)
6. **NewConstructionCostCalculator.tsx** — Remove the badge div (~lines 464-467)
7. **RenovationCostEstimator.tsx** — Remove the badge block (~lines 811-819)

Also remove any now-unused `BadgeCheck` imports where it was the only usage.

No new components. Just deletions.

