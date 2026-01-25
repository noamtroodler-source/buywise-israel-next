

# Calculator Default Values Harmonization Plan

## Objective
Standardize default values across all 7 calculators to represent a consistent "typical user" profile while maintaining tool-specific appropriateness.

---

## Proposed Standard Defaults

Based on the typical BuyWise user (first-time buyer or Oleh in Israel):

| Parameter | Standard Value | Rationale |
|-----------|---------------|-----------|
| Property Price | ₪2,750,000 | Median between current ₪2.5M and ₪3M values; realistic entry-level Tel Aviv/Herzliya area |
| Down Payment % | 25% | Minimum for first-time buyers per Bank of Israel |
| Monthly Income | ₪25,000 | ~300K/year, typical dual-income young professional household |
| Interest Rate | 5.25% | Midpoint of current market range (aligns with MORTGAGE_RATE_RANGES.mid) |
| Loan Term | 25 years | Most common term in Israel |
| Buyer Type | first_time | Default assumption for new users |

---

## Changes by Calculator

### 1. MortgageCalculator.tsx
**Current:** ₪3,000,000, 5.0%
**Change to:** ₪2,750,000, 5.25%

```tsx
const DEFAULTS = {
  propertyPrice: 2750000,  // Changed from 3000000
  downPaymentPercent: 25,
  buyerType: 'first_time' as BuyerType,
  loanTermYears: 25,
  interestRate: 5.25,  // Changed from 5.0
};
```

### 2. AffordabilityCalculator.tsx
**Current:** ₪25,000 income, ₪500,000 down, 5.5%
**Change to:** ₪25,000 income, ₪687,500 down (25% of ₪2.75M), 5.25%

```tsx
const DEFAULTS = {
  monthlyIncome: 25000,
  spouseIncome: 0,
  monthlyDebts: 2000,
  downPayment: 687500,  // Changed from 500000 (25% of 2.75M)
  interestRate: 5.25,   // Changed from 5.5
  loanTermYears: 25,
  employmentType: 'employed' as const,
  hasForeignIncome: false,
  foreignIncomePercent: 0,
};
```

### 3. PurchaseTaxCalculator.tsx
**Current:** ₪2,500,000
**Change to:** ₪2,750,000

```tsx
const DEFAULTS = {
  propertyPrice: 2750000,  // Changed from 2500000
  buyerType: 'first_time' as BuyerType,
  aliyahYear: undefined as number | undefined,
  purchaseDate: new Date(),
};
```

### 4. TrueCostCalculator.tsx
**Current:** ₪2,500,000, 85 sqm
**Change to:** ₪2,750,000, 80 sqm (matches Renovation)

```tsx
// Default values in useState calls
const [propertyPrice, setPropertyPrice] = useState('2750000');  // Changed from 2500000
const [propertySize, setPropertySize] = useState('80');  // Changed from 85
```

Also update handleReset:
```tsx
const handleReset = useCallback(() => {
  setPropertyPrice('2750000');  // Changed
  setPropertySize('80');  // Changed
  // ... rest unchanged
}, []);
```

### 5. RentVsBuyCalculator.tsx
**Current:** ₪3,000,000, ₪7,500 rent, 5.0%
**Change to:** ₪2,750,000, ₪7,000 rent, 5.25%

```tsx
const DEFAULTS = {
  propertyPrice: 2750000,  // Changed from 3000000
  monthlyRent: 7000,       // Changed from 7500 (proportional)
  rooms: '3',
  downPaymentPercent: '25',
  interestRate: '5.25',    // Changed from 5.0
  timeHorizon: 10,
  appreciation: '3.0',
  rentIncrease: '3.0',
  investmentReturn: '5.0',
};
```

### 6. InvestmentReturnCalculator.tsx
**Keep Different** - This calculator targets investors, not first-time buyers

Investors have different constraints:
- 50% minimum down payment (Bank of Israel regulation)
- Typically different rate expectations
- Different property targets

**No changes needed** - These defaults are intentionally investor-focused.

### 7. RenovationCostEstimator.tsx
**Current:** 80 sqm, 1995 building
**No changes needed** - Already reasonable and tool-specific.

---

## Summary of File Changes

| File | Changes |
|------|---------|
| `src/components/tools/MortgageCalculator.tsx` | Price: 3M→2.75M, Rate: 5.0→5.25 |
| `src/components/tools/AffordabilityCalculator.tsx` | Down: 500K→687.5K, Rate: 5.5→5.25 |
| `src/components/tools/PurchaseTaxCalculator.tsx` | Price: 2.5M→2.75M |
| `src/components/tools/TrueCostCalculator.tsx` | Price: 2.5M→2.75M, Size: 85→80 |
| `src/components/tools/RentVsBuyCalculator.tsx` | Price: 3M→2.75M, Rent: 7.5K→7K, Rate: 5.0→5.25 |
| `src/components/tools/InvestmentReturnCalculator.tsx` | No changes (investor-specific) |
| `src/components/tools/RenovationCostEstimator.tsx` | No changes |

---

## Why These Values?

### ₪2,750,000 Property Price
- Realistic entry point for a 3-room apartment in greater Tel Aviv area
- Not too high to discourage first-time buyers
- Not too low to seem unrealistic in current market
- Splits the difference between existing values for consistency

### 5.25% Interest Rate
- Matches `MORTGAGE_RATE_RANGES.mid` used throughout the codebase
- Current market average for mixed-track mortgages
- Provides consistent baseline across all calculators

### 25% Down Payment
- Bank of Israel minimum for first-time buyers
- Realistic for young couples saving for first home
- Aligns with "stretch but achievable" positioning

### ₪25,000 Monthly Income
- ~₪300K annual household income
- Typical for dual-income professional couple in Tel Aviv
- Supports ₪2.75M purchase with 40% PTI

---

## Expected Outcome

After implementation:
- All general-purpose calculators use ₪2,750,000 as baseline property price
- Interest rate assumptions aligned at 5.25% (market midpoint)
- Down payment reflects 25% first-time buyer minimum
- Investment calculator retains investor-appropriate defaults
- Users see consistent, believable numbers across all tools

