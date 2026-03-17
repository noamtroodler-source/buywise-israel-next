

## Centralize Va'ad Bayit Default Constant

### Problem
Six files use hardcoded Va'ad Bayit defaults: ₪300, ₪350, and ₪450.

### Plan

**1. Add to `src/lib/calculations/constants.ts`**

Add `VAAD_BAYIT_DEFAULT: 350` to `FALLBACK_CONSTANTS`. This becomes the single source of truth.

**2. Update 5 consumer files** to import `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` instead of hardcoded numbers:

| File | Current | Change to |
|------|---------|-----------|
| `PropertyValueSnapshot.tsx` | `450` (×2) | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |
| `PropertyCostBreakdown.tsx` | `300` | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |
| `TotalCostCalculator.tsx` | `350` | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |
| `RentVsBuyCalculator.tsx` | `350` | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |
| `InvestmentROICalculator.tsx` | `350` | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |
| `rentalYield.ts` | `350` | `FALLBACK_CONSTANTS.VAAD_BAYIT_DEFAULT` |

All files already prefer city-specific data when available (`cityData?.average_vaad_bayit`); the constant is only the last-resort fallback.

