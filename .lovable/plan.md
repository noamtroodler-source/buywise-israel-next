

# Comprehensive Tool-by-Tool Audit Plan for BuyWise Israel

## Executive Summary

This audit covers all 8 property calculators/tools on the platform, evaluating each for:
- **Accuracy**: Cross-checking calculations against official 2025 Israeli sources
- **Data integrity**: Ensuring inputs flow correctly to outputs
- **UX/Design**: Balance between comprehensive and approachable
- **Content quality**: Educational value without overwhelming users
- **Brand consistency**: Alignment with BuyWise Israel design standards

---

## Critical Findings to Address First

### Finding 1: Oleh Tax Brackets May Need Update for 2025

**Current code** (`src/lib/calculations/purchaseTax.ts` lines 44-49):
```
oleh: [
  { min: 0, max: 1978745, rate: 0 },
  { min: 1978745, max: 6055070, rate: 0.005 }, // 0.5%
  { min: 6055070, max: 20183560, rate: 0.08 },
  { min: 20183560, max: null, rate: 0.10 },
]
```

**2025 official rates** (from Semerenko Group / Israel Tax Authority):
- 0-1,978,745: 0%
- 1,978,745-6,055,070: 0.5%
- 6,055,070-20,183,565: **8%** (matches)
- Above 20,183,565: **10%** (matches)

**Verification**: The current brackets match the 2025 official rates. However, the database shows `rate_percent: 5` for Oleh above 6,055,070 which conflicts with the hardcoded 8% in the code. Need to verify which is authoritative.

**Action**: Ensure database `purchase_tax_brackets` table for `oleh` buyer type matches the code. The code shows 8% and 10% for top brackets, but the database shows 5% for the third bracket.

### Finding 2: VAT Rate Correctly Updated

**Status**: The code correctly reflects the 18% VAT rate as of January 2025 (was 17%). Found in:
- `src/lib/calculations/purchaseCosts.ts` line 67
- `src/components/tools/TrueCostCalculator.tsx` line 91
- `src/components/tools/RentVsBuyCalculator.tsx` line 84

### Finding 3: PTI Limit Correctly Updated

**Status**: The code correctly shows 50% maximum Payment-to-Income ratio per Bank of Israel Directive 329 v11.
- `src/lib/calculations/mortgage.ts` line 73
- `src/components/tools/AffordabilityCalculator.tsx` lines 89-90

---

## Tool-by-Tool Audit

### Tool 1: Mortgage Calculator

**Location**: `src/components/tools/MortgageCalculator.tsx`

**Accuracy Check**:
| Calculation | Status | Notes |
|-------------|--------|-------|
| PMT formula | Verified | Standard amortization formula |
| LTV limits | Verified | First-time: 75%, Upgrader: 70%, Investor/Foreign: 50%, Oleh: 75% |
| PTI (Payment-to-Income) | Verified | 50% max per BoI Directive 329 v11 |
| Stress test (+1%, +2%) | Verified | Bank of Israel recommends +2% test |
| Variable rate limit | Verified | 33.3% max in variable tracks |

**UX Assessment**:
- Good: Has "ExampleValuesHint" explaining default values
- Good: BuyerTypeInfoBanner shows personalized context
- Good: Stress test section helps with risk awareness
- Good: "Honest ranges" showing low/mid/high payment estimates
- Good: Israel-specific track explanations (Prime, Fixed-Linked, etc.)

**Recommended Improvements**:
1. Add tooltip explaining what "Prime" rate means in Israel context
2. Consider adding a "typical bank quote" disclaimer
3. Source attribution uses Directive 329 v11 but shows April 2025 effective date - verify this is correct

---

### Tool 2: Affordability Calculator

**Location**: `src/components/tools/AffordabilityCalculator.tsx`

**Accuracy Check**:
| Calculation | Status | Notes |
|-------------|--------|-------|
| Max PTI 50% | Verified | Matches BoI regulations |
| LTV by buyer type | Verified | Correct limits applied |
| Foreign income haircut | Verified | 70-85% discount applied |
| Self-employed discount | Verified | 70% multiplier |
| Max display cap | Verified | ₪99.9M ceiling |

**UX Assessment**:
- Good: Clear income fields with spouse option
- Good: Employment type selector with multipliers
- Good: Foreign income toggle with explanation
- Good: Visual progress indicator

**Recommended Improvements**:
1. Add stress test showing how 1% rate increase affects max budget
2. Consider showing "conservative" vs "aggressive" budget ranges
3. Add note about typical bank requirements beyond just PTI

---

### Tool 3: True Cost Calculator

**Location**: `src/components/tools/TrueCostCalculator.tsx`

**Accuracy Check**:
| Cost Item | Status | Notes |
|-----------|--------|-------|
| Purchase tax | Verified | Uses correct 2025 brackets |
| VAT 18% | Verified | Updated from 17% |
| Lawyer 0.5-1.5% + VAT | Verified | Standard range |
| Agent 2% + VAT | Verified | Resale only |
| Tabu registration | Verified | ₪300-600 range |
| Mortgage origination | Verified | ₪360 cap by law |
| Developer lawyer | Verified | 1.5-2% for new construction |

**UX Assessment**:
- Good: Toggle for new construction vs resale
- Good: City-based Arnona estimates
- Good: Optional toggles for moving/furniture/renovation
- Good: Uses city metrics for price comparison

**Recommended Improvements**:
1. Clarify that agent fee is typically paid by buyer (not seller) in Israel
2. Add bank guarantee explanation for new construction
3. Consider adding Madad linkage warning for new construction more prominently

---

### Tool 4: Rent vs Buy Calculator

**Location**: `src/components/tools/RentVsBuyCalculator.tsx`

**Accuracy Check**:
| Calculation | Status | Notes |
|-------------|--------|-------|
| Purchase costs | Verified | Uses calculateTotalPurchaseCosts |
| Purchase tax by buyer type | Verified | Correct mapping |
| Appreciation assumptions | Note | Uses user input, defaults 4% |
| Rent increase | Verified | 3% annual default |
| Capital gains (Mas Shevach) | Verified | Uses proper exemptions |

**UX Assessment**:
- Good: Clear Pros/Cons for both options
- Good: Time horizon selector
- Good: Qualitative factors alongside numbers
- Good: VAT correctly at 18%

**Recommended Improvements**:
1. Add explicit note about Madad (index) for rent increases
2. Consider showing break-even timeline more prominently
3. Add warning about appreciation assumptions being uncertain

---

### Tool 5: Investment Return Calculator

**Location**: `src/components/tools/InvestmentReturnCalculator.tsx`

**Accuracy Check**:
| Calculation | Status | Notes |
|-------------|--------|-------|
| Gross yield | Verified | Annual rent / price |
| Net yield | Verified | After expenses |
| Rental tax options | Verified | Exemption (₪5,471/mo), 10% flat, progressive |
| Vacancy rates | Verified | City-specific estimates |
| Cash-on-cash return | Verified | Correct formula |
| Capital gains on exit | Verified | Uses Mas Shevach calculation |

**UX Assessment**:
- Good: City-based rent suggestions
- Good: Three tax method comparison
- Good: Investment grade scoring (A+ to D)
- Good: Multi-year projection

**Recommended Improvements**:
1. Clarify rental income tax exemption threshold more prominently (₪5,471/month)
2. Add note about management fee being deductible under progressive method
3. Consider adding Tel Aviv/periphery yield benchmark comparison

---

### Tool 6: Renovation Cost Estimator

**Location**: `src/components/tools/RenovationCostEstimator.tsx`

**Accuracy Check**:
| Category | Price Range | Status |
|----------|-------------|--------|
| Kitchen (standard) | ₪55k-90k | Reasonable |
| Bathroom (standard) | ₪40k-65k | Reasonable |
| Flooring (standard/sqm) | ₪280-450 | Reasonable |
| Painting (standard/sqm) | ₪50-80 | Reasonable |
| Electrical (full rewire) | ₪25k-45k | Reasonable |
| HVAC (multi-split) | ₪15k-30k | Reasonable |
| Mamad (safe room) | ₪80k-120k | Reasonable for prefab |

**UX Assessment**:
- Good: Quality level selector (Basic/Standard/Premium)
- Good: Israel-specific categories (Mamad)
- Good: Timeline estimates per category
- Good: Permit requirement warnings

**Recommended Improvements**:
1. Add 30/40/30 payment schedule explanation
2. Consider adding regional cost variation note
3. Add Tofes 4 requirement note for major renovations
4. Include contingency recommendation (10-20% buffer)

---

### Tool 7: Document Checklist

**Location**: `src/components/tools/DocumentChecklistTool.tsx`

**Accuracy Check**:
- Sources documents from database (`useDocumentsByStage`)
- Covers Buy and Rent transaction types
- Filters by buyer type (Israeli, Oleh, Foreign)

**UX Assessment**:
- Good: Progress tracking with celebration
- Good: Stage-by-stage organization
- Good: Critical document flagging
- Good: Print functionality

**Recommended Improvements**:
1. Add Hebrew document names for recognition at offices
2. Consider adding "where to get" icons/links
3. Add estimated processing time for each document

---

### Tool 8: Readiness Check

**Location**: `src/components/tools/ReadinessCheckTool.tsx`

**Accuracy Check**:
- Qualitative assessment tool, not calculation-based
- Links to relevant guides and tools

**UX Assessment**:
- Good: Journey stage selector
- Good: Knowledge gap identification
- Good: Encouraging affirmations (brand voice aligned)
- Good: Resource recommendations

**Recommended Improvements**:
1. Consider adding a "readiness score" summary
2. Add progress saving to profile
3. Link gaps directly to specific guide sections

---

## Cross-Tool Consistency Checks

### Default Values Harmony

| Tool | Default Price | Status |
|------|---------------|--------|
| Mortgage | ₪2,750,000 | Standard |
| Affordability | ₪687,500 down payment (25%) | Standard |
| True Cost | ₪2,750,000 | Standard |
| Rent vs Buy | Uses city metrics | Adaptive |
| Investment | ₪2,500,000 | Slightly different |
| Purchase Tax | ₪2,750,000 | Standard |
| New Construction | ₪2,500,000 | Slightly different |

**Action**: Consider harmonizing Investment and New Construction defaults to ₪2,750,000 for consistency.

### Interest Rate Defaults

| Tool | Default Rate |
|------|--------------|
| Mortgage | 5.25% |
| Affordability | 5.25% |
| Rent vs Buy | 4.5% (for estimates) |
| Investment | 4.5% |

**Action**: Consider standardizing to 5.25% across all tools as it's the current market midpoint.

### Buyer Type Mapping

All tools correctly map:
- `first_time` → First-Time Buyer
- `oleh` → New Immigrant (Oleh Hadash)
- `investor` / `additional` → Additional Property
- `foreign` / `non_resident` → Foreign Resident

---

## Database Data Integrity Check

### purchase_tax_brackets Table Issue

**Problem**: Database shows `oleh` buyer type third bracket at 5% rate:
```
bracket_min: 6055070, buyer_type: oleh, rate_percent: 5
```

**Code shows** (`purchaseTax.ts`): 8% for this bracket

**Official 2025 rates**: 8% for 6,055,070 - 20,183,565

**Action Required**: Update database to match official rates. The database entry appears incorrect.

### calculator_constants Table

Verified constants present for:
- VAT rate (18%)
- LTV limits by buyer type
- Arnona discounts
- Lawyer/agent fee ranges

---

## Design & Branding Consistency

All tools verified to include:
- ToolLayout wrapper for consistent structure
- BuyerTypeInfoBanner for personalization
- ExampleValuesHint for default value transparency
- SourceAttribution for trust signals
- ToolDisclaimer with variant-specific text
- ToolFeedback for user engagement
- Primary blue (not red/green) for data indicators

---

## Technical Section

### Calculation Libraries

All calculation logic is centralized in:
```
src/lib/calculations/
├── purchaseTax.ts      # Mas Rechisha brackets
├── mortgage.ts         # PMT, LTV, PTI calculations
├── purchaseCosts.ts    # One-time and recurring costs
├── capitalGains.ts     # Mas Shevach calculation
├── rentalYield.ts      # Yield and ROI projections
├── constants.ts        # Fallback values
└── toolSources.ts      # Source attribution config
```

### Database Tables Used

- `calculator_constants` - Configurable rates and limits
- `purchase_tax_brackets` - Tax bracket definitions
- `document_checklist` - Document requirements
- `canonical_metrics` - City market data

### Key Implementation Details

1. **Personalization Flow**: All tools read from `useBuyerProfile()` hook to auto-set buyer type
2. **Session Persistence**: Each tool saves state to `sessionStorage` for return visits
3. **Save to Profile**: Logged-in users can save results via `useSaveCalculatorResult()`
4. **Currency Support**: Tools respect user's ILS/USD preference via `usePreferences()`

---

## Priority Action Items

### Critical (Do Before Launch)

1. **Fix Oleh tax bracket in database**: Update `purchase_tax_brackets` table to show 8% (not 5%) for third bracket

### High Priority

2. **Harmonize default property prices**: Align Investment and New Construction to ₪2,750,000
3. **Standardize interest rates**: Use 5.25% consistently across all tools

### Medium Priority

4. **Add contingency buffer** to Renovation Estimator results (10-20% recommendation)
5. **Enhance Document Checklist** with Hebrew document names
6. **Add break-even timeline** as prominent feature in Rent vs Buy

### Low Priority (Post-Launch Polish)

7. Add regional cost variation notes to Renovation Estimator
8. Improve Readiness Check with progress persistence
9. Consider adding "comparison mode" to run multiple scenarios side-by-side

