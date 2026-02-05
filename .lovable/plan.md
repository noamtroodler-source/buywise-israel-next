
# Tool Logic Verification & Accuracy Audit

## Summary

After thorough analysis of the calculation files, buyer type logic, and comparison with the expert content you provided, I found that **most core logic is accurate**, but there is **one significant discrepancy** in the debt-to-income (PTI) limits that needs correction, plus several minor improvements to ensure alignment with the expert content.

---

## Part 1: Critical Issue Found - Debt-to-Income Limit

### Current Code (INCORRECT)
```typescript
// mortgage.ts & constants.ts
const MAX_PTI = 0.50; // 50% max - WRONG
```

### Expert Content Says
> "The Bank of Israel generally limits the debt-to-income ratio to 33-40% of your net monthly income."

This is a **significant discrepancy** - the code allows 50% PTI but real Israeli regulations cap at 40%. This affects:
- Affordability Calculator results (overstates what users can borrow)
- Mortgage Calculator's "Can you afford this?" checks

### Fix Required
- Update `MAX_PTI` from `0.50` to `0.40` in both `mortgage.ts` and `constants.ts`
- Update the comment to reflect accurate Bank of Israel regulations
- Note: The guide text at line 85 of `MortgagesGuide.tsx` already correctly states "33-40%"

---

## Part 2: Verified as Correct

| Component | Current Value | Expert Source | Status |
|-----------|---------------|---------------|--------|
| LTV - First-time | 75% | "up to 75% LTV" | ✅ Correct |
| LTV - Olim | 75% | "Same as first-time" | ✅ Correct |
| LTV - Upgraders | 70% | "70% for upgraders" | ✅ Correct |
| LTV - Investors | 50% | "50% for investors" | ✅ Correct |
| LTV - Foreign | 50% | "up to 50% (some 70%)" | ✅ Correct |
| Oleh Tax - First ₪1.98M | 0% | "first 1.98M exempt" | ✅ Correct |
| Oleh Tax - Up to ₪6M | 0.5% | "0.5% up to 6M" | ✅ Correct |
| Oleh Benefit Window | 7 years | "7 years after Aliyah" | ✅ Correct |
| Foreign/Investor Tax | 8-10% | "8-10% on all purchases" | ✅ Correct |
| Upgrader Window | 18 months | "Selling within 18 months" | ✅ Correct |
| Lawyer Fees | 0.5-1.5% + VAT | "0.5%-1.5% + VAT" | ✅ Correct |
| Developer Lawyer | 1.5-2% + VAT | "1.5-2% + VAT" | ✅ Correct |
| Agent Commission | 2% + VAT | "2% + VAT" | ✅ Correct |
| Madad Linkage | 2% annual | Mentioned in guides | ✅ Correct |
| Security Deposit Cap | 3 months | "Cannot exceed 3 months" | ✅ Correct |
| VAT Rate | 18% | Jan 2025 update | ✅ Correct |

---

## Part 3: Minor Enhancements Recommended

### 3A. Add Foreign Income Haircut Tooltip
The code has a `calculateForeignIncomeDiscount` function (80% haircut for USD) but this isn't prominently explained in the Mortgage Calculator UI.

**Enhancement**: Add tooltip text:
> "Foreign currency income may be discounted 20-30% by Israeli banks when calculating your borrowing capacity."

### 3B. Add Government Oleh Mortgage Mention
From expert content:
> "Olim may receive a government mortgage at a fixed 3% interest for 20-25 years"

This isn't currently mentioned in tools. Add to Oleh buyer type description.

### 3C. Add 60-Day Tax Payment Warning
From user's text:
> "Pay any tax due within 60 days, unless a formal deferral is granted"
> "5% monthly interest on unpaid capital gains tax"

**Enhancement**: Add warning in Purchase Tax Calculator results:
> "Payment due within 60 days of signing. Late payment incurs ~5% monthly interest."

### 3D. Clarify Pre-payment Penalty Logic
Current code correctly implements prepayment penalties for fixed-rate loans only. Confirm alignment with expert content:
> "Variable-rate loans generally do not have pre-payment penalties, fixed-rate loans often incur penalties"

✅ Already correctly implemented in `calculatePrepaymentPenalty()` function.

---

## Implementation Plan

### Step 1: Fix PTI Limit (CRITICAL)
**Files to modify:**
- `src/lib/calculations/mortgage.ts` - Line 73
- `src/lib/calculations/constants.ts` - Line 28

**Change:**
```typescript
// Before
const MAX_PTI = 0.50; // 50% max

// After  
const MAX_PTI = 0.40; // 40% max - Bank of Israel Directive 329
```

### Step 2: Add Tooltip Enhancements
**Files to modify:**
- `src/components/tools/MortgageCalculator.tsx` - Add foreign income tooltip
- `src/components/tools/PurchaseTaxCalculator.tsx` - Add 60-day payment warning

### Step 3: Enhance Buyer Type Descriptions
**Files to modify:**
- `src/components/tools/MortgageCalculator.tsx` - BUYER_TYPE_OPTIONS array

**Add to foreign buyer description:**
```typescript
{ 
  value: 'foreign', 
  label: 'Non-Resident', 
  maxLtv: 50, 
  description: 'Not a resident of Israel. Foreign income discounted 20-30%. May require Israeli guarantor.' 
}
```

**Add to oleh description:**
```typescript
{ 
  value: 'oleh', 
  label: 'Oleh Hadash', 
  maxLtv: 75, 
  description: 'New immigrant within 7 years. May qualify for government mortgage at ~3% fixed rate.' 
}
```

---

## What Doesn't Need Changes

The following are already correctly implemented:
- Purchase tax bracket calculations
- 6-category buyer type system (first_time, oleh, upgrader, investor, foreign, company)
- LTV limits by buyer type
- Oleh 7-year benefit window calculation
- Upgrader 18-month deadline calculation
- New construction Madad linkage
- Lawyer/agent fee ranges
- VAT at 18%
- Bank guarantee calculations for new construction
- Multi-track mortgage calculations
- Stress test calculations (+1%, +2% rate scenarios)

---

## Technical Summary

| Fix Type | Priority | Files Affected | Effort |
|----------|----------|----------------|--------|
| PTI Limit 50% → 40% | Critical | 2 files | Small |
| Foreign income tooltip | Medium | 1 file | Small |
| 60-day payment warning | Medium | 1 file | Small |
| Buyer type descriptions | Low | 1 file | Small |

Total scope: 4 small file edits, ~15 lines of code changes.
