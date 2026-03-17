

## Refactor Calculators to Use DB-First Constants

### Problem
Multiple calculators hardcode magic numbers (VAT `1.17`/`1.18`, insurance `150`, arnona `400`/`500`, maintenance `0.005`, agent `0.02`) instead of pulling from the `calculator_constants` DB table. The infrastructure (`useCalculatorConstants` hook + `getConstant` helper) already exists but is underused.

### Step 1 — Add missing keys to `FALLBACK_CONSTANTS`

In `src/lib/calculations/constants.ts`, add:
- `HOME_INSURANCE_MONTHLY: 150`
- `ARNONA_DEFAULT_MONTHLY: 500`
- `MAINTENANCE_RATE: 0.01` (1% of property value/year)
- `VACANCY_RATE_DEFAULT: 0.05`
- `SELLING_AGENT_RATE: 0.02`

### Step 2 — Seed DB with new constants

Insert rows into `calculator_constants` for each new key so DB values take precedence.

### Step 3 — Refactor consumer files (6 files)

| File | What changes |
|------|-------------|
| `RentVsBuyCalculator.tsx` | Replace `FEES` object with `useCalculatorConstants()` + `getConstant()` calls for `VAT_RATE`, `LAWYER_RATE_MIN`, `AGENT_RATE`, `HOME_INSURANCE_MONTHLY`, `MAINTENANCE_RATE`, `ARNONA_DEFAULT_MONTHLY` |
| `InvestmentROICalculator.tsx` | Replace hardcoded `500` arnona and `150` insurance defaults with `getConstant()` |
| `InvestmentReturnCalculator.tsx` | Replace `0.02 * 1.17` and `1.17` with `getConstant(constants, 'AGENT_RATE') * getVatMultiplier(constants)` |
| `TrueCostWalkthrough.tsx` | Replace `* 1.18`, `0.02`, `0.01` with `getConstant()` + `getVatMultiplier()` |
| `TrueCostCalculator.tsx` | Replace `* 1.18` in agent fee tip with `getVatMultiplier()` |
| `rentalYield.ts` | Replace hardcoded `150` insurance with `FALLBACK_CONSTANTS.HOME_INSURANCE_MONTHLY`; accept optional constants param |

### Pattern
Each component calls `useCalculatorConstants()` once at top level, passes result to `getConstant(constants, 'KEY')`. Pure calculation functions accept an optional `constants` param, falling back to `FALLBACK_CONSTANTS`.

### No breaking changes
- All existing defaults match current hardcoded values
- DB values override when present; fallbacks identical to today
- 1-hour cache on the query means no performance impact

