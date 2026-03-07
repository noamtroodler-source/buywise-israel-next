

# Enhance Rule-Based Insights Across All Calculators

## Audit Summary

I reviewed all 7 calculators with "What This Means For You" sections. Here's what each has and what's missing:

| Calculator | Current Insights | Quality | Gaps |
|---|---|---|---|
| **Affordability** | 2 tips (limiting factor + employment discount) | Basic | No score-based tone, no actionable numbers ("save ₪X more → unlock ₪Y"), no rate sensitivity mention |
| **Mortgage** | LTV position, term cost, buyer-type tips | Good | No PTI warning, no "what extra ₪X/month would save you" |
| **True Cost** | Overhead %, tax savings, madad | Good | No "cash you need on day one" summary, no lawyer negotiation tip when fees are high |
| **Purchase Tax** | Savings vs investor, oleh window, effective rate | Good | No bracket proximity ("you're ₪X from the next bracket"), always shows ≤2 insights |
| **Rent vs Buy** | Break-even, space advantage | Thin | No monthly cost comparison sentence, no opportunity cost of down payment |
| **Investment Return** | Grade commentary, cash flow, tax method | Good | No comparison to benchmark (e.g., stock market return), no vacancy impact callout |
| **Renovation** | Scale, timeline, quality, age alerts | OK | No per-sqm context, no "get 3 quotes" reminder for large projects |
| **New Construction** | Linkage %, timeline, index rate | OK | Always shows generic "budget 5-10% for upgrades" even when not relevant |

## Principles for Enhancement

1. **Every insight must derive from actual calculated values** — no generic filler
2. **Remove the static "budget 5-10% for upgrades" line** from New Construction (it's generic advice, not personalized)
3. **Add compound insights** that combine 2+ inputs into one actionable sentence
4. **Add specific numbers** — "Paying off your ₪2,000/month debt would increase your budget by ₪X" (actually calculate it)
5. **Max 3 insights per calculator** — quality over quantity
6. **Never show an insight that doesn't change based on input** — if it's always true, it belongs in the education section, not insights

## Changes Per Calculator

### 1. Affordability Calculator
- **Add:** If debts > 0, calculate and show exact budget increase from eliminating debts: "Clearing your ₪X/month in debts would raise your max property price by ~₪Y"
- **Add:** Affordability score tone shift — if score ≤ 40, warn "This is a stretched budget"; if ≥ 80, affirm "Comfortable position"
- **Add:** Rate sensitivity: "If rates rise 1%, your budget drops by ₪{stressedReduction}" (data already exists in `calculations.stressedReduction`)
- **Remove:** Generic "reducing existing debts would increase" → replace with the specific number version

### 2. Mortgage Calculator  
- **Add:** If total burden (mortgage + debts) > 40% of income, show "Your total debt load is {X}% of income — banks may scrutinize this"
- **Add:** Interest cost context: "Interest adds {totalInterest} — that's {percent}% of the property price"
- **Keep:** Existing LTV, term, buyer-type insights (they're solid)

### 3. True Cost Calculator
- **Add:** Day-one cash summary: "You'll need ₪{downPayment + allCosts} in cash before getting the keys"
- **Add:** If agent fee > ₪30K, note "Agent fees are negotiable in Israel — even 0.5% less saves you ₪X"
- **Keep:** Existing overhead %, tax savings, madad insights

### 4. Purchase Tax Calculator
- **Add:** Bracket proximity: If price is within 10% of a bracket boundary, show "You're ₪X below the next tax bracket — small price increases here cost more in tax"
- **Add:** Comparison insight for non-first-time: "A first-time buyer would pay ₪{difference} less on this property"
- **Keep:** Existing oleh/upgrader/effective rate insights

### 5. Rent vs Buy Calculator
- **Add:** Monthly cost comparison: "Buying costs ₪{monthlyBuying}/month vs ₪{rent}/month renting — a difference of ₪{diff}"
- **Add:** Down payment opportunity cost: "Your ₪{downPayment} could earn ~₪{investmentReturn}/year invested elsewhere"
- **Keep:** Break-even and space advantage insights

### 6. Investment Return Calculator
- **Add:** Stock market benchmark: "Your {cashOnCash}% return compares to ~7-8% average in index funds — {better/worse} on a risk-adjusted basis"
- **Add:** If vacancy > 5%, note impact: "Each vacant month costs you ₪{monthlyRent} — {vacancyRate}% vacancy means ~₪{annualVacancyCost}/year lost"
- **Keep:** Grade, cash flow, tax method insights

### 7. Renovation Cost Estimator
- **Remove:** Generic fallback when no categories selected (no insight is better than generic)
- **Add:** Per-sqm context when property size is provided: "At ₪{perSqm}/sqm, this is a {light/moderate/heavy} renovation by Israeli standards"
- **Add:** For projects > ₪150K: "Get at least 3 written quotes — price variation of 20-30% is normal in Israel"
- **Keep:** Timeline, quality, age alerts

### 8. New Construction Calculator
- **Remove:** Static "Budget an extra 5-10% for upgrades" line (always shows, not input-dependent)
- **Add:** If linkage is low (<2%): "Low index exposure — your final price should be close to contract price"
- **Keep:** Other linkage/timeline insights

## Implementation Approach

Each calculator's `useMemo` insight block gets updated in-place. No new components or hooks needed. All new insights use values already computed in each calculator's existing calculation logic.

