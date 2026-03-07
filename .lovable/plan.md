

# Fix PTI Discrepancy & Make Education Section Dynamic

## Problem
The "How Israeli Banks Calculate Your Budget" education section hardcodes "50% of income" for the PTI ratio. The actual system uses **40%** (from `MAX_PTI: 0.40` in `constants.ts`, per BoI Directive 329). This is a factual error.

Additionally, the LTV limits are hardcoded text that could drift from the database values.

## Changes

**File:** `src/components/tools/AffordabilityCalculator.tsx` (line 544)

1. **Fix PTI text:** Change "50%" → dynamically read from `getMaxPti(constants)` and display as `${Math.round(maxPti * 100)}%`
2. **Make LTV text dynamic:** Read LTV limits from constants and display actual values (75%/70%/50%)
3. The `constants` data is already available in this component via `useCalculatorConstants()`

The education section's 4 grid items stay the same layout — just the numbers become dynamic instead of hardcoded strings.

