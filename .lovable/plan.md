

## Plan: Fix Affordability Calculator Accuracy Issues

Based on the audit, there are 5 issues to fix in `src/components/tools/AffordabilityCalculator.tsx`:

### 1. Add Upgrader LTV (70%) — currently lumped with investors at 50%

**Lines 89-93**: Replace the binary first-home/additional constants with per-category LTV values:
```
MAX_LTV_FIRST_HOME = 0.75  (first_time, oleh) ✅ correct
MAX_LTV_UPGRADER = 0.70    (additional — selling one, buying another) ← NEW
MAX_LTV_INVESTOR = 0.50    (investor, foreign) ✅ correct
```

**Line 209**: Update `maxLTV` logic to check for `additional` (upgrader) separately:
- `first_time` / `oleh` → 75%
- `additional` → 70%
- `investor` / `foreign` → 50%

### 2. Change income label from "Net" to "Gross"

Israeli banks use gross income for PTI. Two changes:
- **Line 342**: Label → "Your Monthly Gross Income"
- **Line 342**: Tooltip → "Your salary before taxes. Banks use gross income for debt-to-income calculations."
- **Line 346**: Spouse tooltip updated similarly

### 3. Use centralized constants instead of hardcoded values

Import `getLtvLimit` and `getMaxPti` from the constants library and `useCalculatorConstants` hook. Replace local `MAX_PTI_*` and `MAX_LTV_*` constants with calls to these functions, keeping current values as fallbacks.

### 4. Dynamic down payment tooltip

**Line 363**: Change static "First-time buyers need 25% minimum" to dynamically reflect selected buyer type:
- first_time/oleh → "need at least 25% down"
- additional (upgrader) → "need at least 30% down"
- investor/foreign → "need at least 50% down"

### 5. Update education section LTV text

**Line 433**: The education section says "First-time buyers can borrow up to 75% (25% down). Investors need 50% down." — add upgraders: "Upgraders can borrow up to 70% (30% down)."

### Files changed
- `src/components/tools/AffordabilityCalculator.tsx` — all changes in this single file

