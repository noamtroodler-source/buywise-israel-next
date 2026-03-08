

## Standardize bottom section layout across all calculators

The user wants a consistent bottom section order matching the Rent vs Buy screenshot:

1. **InsightCard** ("What this means for you")
2. **Educational collapsibles** (if any)
3. **SourceAttribution** (data sources)
4. **ToolPropertySuggestions** (property carousel)
5. **"Continue exploring"** divider + nav cards (using the new centered divider pattern from RentVsBuy)
6. **ToolDisclaimer** (warning box)
7. **ToolFeedback** (centered "Share feedback on this tool →" link)

### Current state vs target

Right now, ToolLayout renders `sourceAttribution` and `disclaimer` **outside** `bottomSection` (after it). Each calculator also has its own inconsistent ordering of InsightCard, nav cards, SourceAttribution, PropertySuggestions, and Feedback.

### Changes

**1. ToolLayout.tsx** — Remove the separate `sourceAttribution` and `disclaimer` render slots. Instead, everything goes inside `bottomSection` so calculators have full control over ordering.

**2. All 8 calculator files** — Restructure each `bottomSection` to follow the standard order:

| Calculator | Files to edit |
|---|---|
| RentVsBuy | Already close — just move SourceAttribution above carousel (it's currently between InsightCard and carousel) |
| Mortgage | Move SourceAttribution + disclaimer into bottomSection, add "Continue exploring" divider, reorder |
| TrueCost | Same restructure |
| Affordability | Same restructure |
| PurchaseTax | Same restructure, no property carousel (no price context) |
| NewConstruction | Same restructure |
| Renovation | Same restructure, no property carousel |
| Investment | Same restructure |
| DocumentChecklist | Same restructure, no property carousel |

For each calculator, the bottomSection becomes:
```
<div className="space-y-8">
  {/* 1. Interpret */}
  <InsightCard ... />
  
  {/* 2. Understand (educational collapsibles if any) */}
  ...
  
  {/* 3. Sources */}
  <SourceAttribution ... />
  
  {/* 4. Property carousel (where applicable) */}
  <ToolPropertySuggestions ... />
  
  {/* 5. Continue exploring */}
  <div className="space-y-3 pt-2">
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 bg-border/60" />
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Continue exploring</span>
      <div className="h-px flex-1 bg-border/60" />
    </div>
    <div className="grid sm:grid-cols-3 gap-4">
      {/* Simple card style nav links */}
    </div>
  </div>
  
  {/* 6. Disclaimer */}
  <ToolDisclaimer ... />
  
  {/* 7. Feedback */}
  <div className="text-center">
    <ToolFeedback toolName="..." variant="inline" />
  </div>
</div>
```

**3. Nav card style** — Standardize all nav cards to use the simpler RentVsBuy card style (Card component with icon, title, subtitle) rather than the rounded-xl border style some calculators use.

**4. ToolLayout.tsx cleanup** — Remove `sourceAttribution` and `disclaimer` props since they'll be inside `bottomSection`. Keep backward compat by still rendering them if passed (but all callers will stop passing them).

### Files modified (10 files)
- `src/components/tools/shared/ToolLayout.tsx`
- `src/components/tools/RentVsBuyCalculator.tsx`
- `src/components/tools/MortgageCalculator.tsx`
- `src/components/tools/TrueCostCalculator.tsx`
- `src/components/tools/AffordabilityCalculator.tsx`
- `src/components/tools/PurchaseTaxCalculator.tsx`
- `src/components/tools/NewConstructionCostCalculator.tsx`
- `src/components/tools/RenovationCostEstimator.tsx`
- `src/components/tools/InvestmentReturnCalculator.tsx`
- `src/components/tools/DocumentChecklistTool.tsx`

