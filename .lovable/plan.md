

# Move Education Collapsible Under InsightCard

Move the "How Israeli Banks Calculate Your Budget" collapsible from its current position (after nav cards) to directly after the InsightCard ("What This Means For You").

## Change

**File:** `src/components/tools/AffordabilityCalculator.tsx`

Current order (lines 544–564):
1. InsightCard (line 544)
2. ToolPropertySuggestions (lines 546–552)
3. Navigation cards (lines 554–558)
4. Education Collapsible (lines 560–564)

New order:
1. InsightCard
2. **Education Collapsible** ← moved here
3. ToolPropertySuggestions
4. Navigation cards

Just cut lines 559–564 (the `{hasInteracted && (...)}` Collapsible block) and paste them immediately after line 544 (after InsightCard).

