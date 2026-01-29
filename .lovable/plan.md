
# Fix: Affordability Calculator Range Text Wrapping

## Problem
The maximum budget range display (e.g., "₪2.3M – ₪2.6M") in the Affordability Calculator wraps to two lines when values have multiple decimal digits. This happens because the browser treats the space around the en-dash (` – `) as a valid line break point.

## Solution
Add `whitespace-nowrap` to the motion.p element displaying the hero range value to prevent text from wrapping regardless of container width.

## File to Modify

### `src/components/tools/AffordabilityCalculator.tsx`

**Line 386-388** - Add `whitespace-nowrap` class:

```tsx
// Before:
<motion.p key={calculations.maxPropertyPrice} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl md:text-5xl font-bold text-primary">
  {formatCurrencyRange(calculations.maxPropertyLow, calculations.maxPropertyHigh, currencySymbol)}
</motion.p>

// After:
<motion.p key={calculations.maxPropertyPrice} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-4xl md:text-5xl font-bold text-primary whitespace-nowrap">
  {formatCurrencyRange(calculations.maxPropertyLow, calculations.maxPropertyHigh, currencySymbol)}
</motion.p>
```

## Additional Consideration

For very large numbers (e.g., "$10.5M – $12.8M" in USD mode), we should also consider:
1. Reducing font size on smaller screens if needed via responsive classes
2. Updating the shared `ResultRange` component to include `whitespace-nowrap` by default for the `hero` variant

I'll add `whitespace-nowrap` to ensure the range always stays on one line, and include responsive font sizing to handle edge cases with very large numbers.

## Changes Summary
| File | Change |
|------|--------|
| `src/components/tools/AffordabilityCalculator.tsx` | Add `whitespace-nowrap` to hero range display |
| `src/components/tools/shared/ResultRange.tsx` | Add `whitespace-nowrap` to hero variant for consistency across all calculators |
