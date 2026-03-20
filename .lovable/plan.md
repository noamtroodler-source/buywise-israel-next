

## Update Market Verdict Badge to BuyWise Brand Voice

**What changes**: Rewrite the `MarketVerdictBadge` in `src/components/property/MarketIntelligence.tsx` to use buyer-focused, actionable language grounded in the BuyWise brand voice.

### Current vs. New Wording

| Range | Current | New |
|-------|---------|-----|
| Below -15% | "Below average — potential value (-X%)" | "May be underpriced by X% vs. recent sales" |
| -15% to -5% | "Below average — potential value (-X%)" | "Priced X% below recent sales — potential value" |
| -5% to +10% | "Priced in line with recent sales" | "Priced in line with recent sales" (no change) |
| +10% to +20% | "Above average for this area (+X%)" | "May be overpriced by X% — room to negotiate" |
| +20%+ | "Significantly above market (+X%)" | "May be overpriced by X% vs. recent sales — negotiate hard" |

### Tooltip Update
Current: "Based on N nearby sales comparing price/sqm."
New: "Based on N government-recorded sales within [radius] over the past 12–24 months."

### Technical Details
- **Single file edit**: `src/components/property/MarketIntelligence.tsx`, lines 60-101 (`MarketVerdictBadge` function)
- Adjust threshold breakpoints: add a new tier for significantly below market (< -15%)
- Keep existing color system (green/amber/red)
- Use absolute value of percentage in display text for cleaner reading ("underpriced by 12%" not "underpriced by -12%")

