

# Cap Maximum Display Values in Affordability Calculator

## Problem

When users enter unrealistically high income values (like ₪7,000,000/month), the calculator displays absurdly large property prices like "₪742.9M – ₪800M". This is unrealistic - essentially nobody buys properties for hundreds of millions of shekels.

## Solution

Cap the maximum property price range at **₪99.9 million** (or ~$27.75M USD equivalent). This is a sensible ceiling for the Israeli residential market - anything above this is ultra-luxury territory that doesn't need calculator precision.

### Implementation

**File: `src/components/tools/AffordabilityCalculator.tsx`**

Add a constant for the maximum displayable property price and apply it when calculating the range values:

```typescript
// Add near other constants (line ~88)
const MAX_DISPLAY_PROPERTY_PRICE = 99900000; // ₪99.9M ceiling

// In the calculations useMemo (around lines 263-264), cap the values:
maxPropertyLow: Math.round(Math.min(maxPropertyAtHighRate, MAX_DISPLAY_PROPERTY_PRICE)),
maxPropertyHigh: Math.round(Math.min(maxPropertyAtLowRate, MAX_DISPLAY_PROPERTY_PRICE)),
```

This ensures:
- The hero range display never shows values like "₪742.9M"
- Maximum display is "₪99.9M" even if calculations go higher
- Other derived values (max loan, monthly payment, etc.) also get naturally capped since they're calculated from capped property prices

### Why Not Cap in `formatCurrencyRange`?

The formatting function is shared across the app. Capping there would affect other legitimate displays. The cap should be applied at the **calculation level** for this specific calculator where unrealistic values don't make sense.

### Edge Cases

- **Very high incomes**: Will see "₪99.9M – ₪99.9M" (both values hit the cap)
- **USD mode**: The ₪99.9M cap translates to ~$27.75M which is also reasonable
- **Other calculators**: Unaffected - they use the shared `formatCurrencyRange` without modification

## Files to Modify

| File | Change |
|------|--------|
| `src/components/tools/AffordabilityCalculator.tsx` | Add `MAX_DISPLAY_PROPERTY_PRICE` constant and apply cap to `maxPropertyLow` and `maxPropertyHigh` calculations |

