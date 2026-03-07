

# Standardize Bottom Section Order Across All Calculators

## Target Order (Interpret → Act → Explore → Understand → Trust → Engage)

Every calculator's `bottomSection` should follow this consistent order:

1. **InsightCard** — "What This Means For You" (immediate interpretation)
2. **ToolPropertySuggestions** — Properties matching the scenario (conversion/action)
3. **Navigation Cards** — Links to related tools/guides (explore)
4. **Education Collapsible(s)** — "How it works" deep-dives (understand)
5. **"Calculated for Israel" badge** + any ToolGuidanceHint (trust)
6. **ToolFeedback** — inline feedback link (engage)

Then via ToolLayout slots (already in correct order):
- `sourceAttribution` (trust)
- `disclaimer` (trust)

## Current vs Target State Per Calculator

| Calculator | Current Order | Changes Needed |
|---|---|---|
| **Affordability** | Education → Insight → Badge → NavCards → Properties → Feedback → Source → Disclaimer | Move Insight to top, Properties after Insight, Education after NavCards |
| **Mortgage** | Education(2x) → Insight → GuidanceHint → Badge → NavCards → Properties → Feedback | Move Insight to top, Properties after Insight |
| **True Cost** | Education → Insight → GuidanceHint → Badge → NavCards → Properties → Feedback | Move Insight to top, Properties after Insight |
| **Purchase Tax** | Insight → NavCards → Feedback | Add Feedback at end (already mostly correct, just missing Properties — N/A for tax calc) |
| **Rent vs Buy** | Insight → Education → Pros/Cons → Breakdown → NavCards → Properties → Feedback | Already close, move Properties up after Insight |
| **Investment** | Education(2x) → Insight → Badge → NavCards → Feedback | Move Insight to top, add Properties |
| **Renovation** | Insight → Education → CTAs → Feedback | Already close — good order |
| **New Construction** | Just InsightCard | Add NavCards, Feedback, Badge |

## Implementation

Reorder the JSX within each calculator's `bottomSection` variable. No new components needed — just moving existing blocks into the standard order. For calculators missing elements (like New Construction missing NavCards/Feedback), add them.

### Files to modify:
1. `src/components/tools/AffordabilityCalculator.tsx` — reorder bottomSection
2. `src/components/tools/MortgageCalculator.tsx` — reorder bottomSection
3. `src/components/tools/TrueCostCalculator.tsx` — reorder bottomSection
4. `src/components/tools/RentVsBuyCalculator.tsx` — move Properties up
5. `src/components/tools/InvestmentReturnCalculator.tsx` — reorder + add Properties
6. `src/components/tools/NewConstructionCostCalculator.tsx` — expand bottomSection with NavCards, Badge, Feedback
7. `src/components/tools/PurchaseTaxCalculator.tsx` — minor: already good order
8. `src/components/tools/RenovationCostEstimator.tsx` — already good order

