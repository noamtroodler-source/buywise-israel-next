

# Calculator Design Uniformity & Cleanup Plan

## Overview

This plan addresses calculator design consistency and removes the unused `RentalIncomeCalculator` component. The focus is on two areas:

1. **Remove dead code** - Delete `RentalIncomeCalculator` and its references
2. **Add missing header actions** - Standardize Reset/Save buttons across all calculators

## Part 1: Remove RentalIncomeCalculator

The `RentalIncomeCalculator` component exists in the codebase but is **NOT** displayed in the Tools page or anywhere user-facing. It should be removed to keep the codebase clean.

### Files to Modify

| File | Action |
|------|--------|
| `src/components/tools/RentalIncomeCalculator.tsx` | Delete entire file |
| `src/App.tsx` (line 161) | Remove redirect route for `/tools/rental-yield-calculator` |
| `src/components/profile/SavedCalculationsCompact.tsx` (line 42) | Remove `rental_yield` case from switch |

**Note:** The calculation functions in `src/lib/calculations/rentalYield.ts` are still used by `InvestmentReturnCalculator`, so we keep those.

---

## Part 2: Add Header Actions to Missing Calculators

Two calculators lack Reset/Save buttons in their headers:

### 2.1 PurchaseTaxCalculator

**Current state:** No header actions (only Share button from ToolLayout)

**Add:**
- Reset button - Resets all inputs to defaults
- Save button - Saves to user profile (for logged-in users)

**Implementation:**
- Add state persistence with localStorage (like other calculators)
- Add `handleReset` and `handleSave` functions
- Add `headerActions` prop to ToolLayout

### 2.2 RenovationCostEstimator

**Current state:** No header actions

**Add:**
- Reset button - Clears all selections and returns to defaults

**Implementation:**
- Add `handleReset` function that resets all state
- Add `headerActions` prop to ToolLayout

---

## Technical Details

### PurchaseTaxCalculator Changes

```tsx
// Add storage key constant
const STORAGE_KEY = 'purchase-tax-calculator-inputs';

// Add handleReset function
const handleReset = () => {
  setPropertyPrice(2500000);
  setBuyerType('first_time');
  setAliyahYear(undefined);
  setPurchaseDate(new Date());
  localStorage.removeItem(STORAGE_KEY);
  toast.success('Calculator reset');
};

// Add handleSave function (using existing useSaveCalculatorResult hook)
const handleSave = async () => {
  if (!user) {
    toast.info('Sign in to save your calculations');
    return;
  }
  // Save logic similar to other calculators
};

// Add headerActions JSX
const headerActions = (
  <>
    <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
      <RotateCcw className="h-4 w-4" />
      <span className="hidden sm:inline">Reset</span>
    </Button>
    <Button variant="ghost" size="sm" onClick={handleSave}>
      <Save className="h-4 w-4" />
      <span className="hidden sm:inline ml-1.5">Save</span>
    </Button>
  </>
);
```

### RenovationCostEstimator Changes

```tsx
// Add handleReset function
const handleReset = () => {
  setPropertySize(80);
  setBuildingYear(1995);
  setPropertyType('apartment');
  setBathroomCount(2);
  setSelectedCategories(['painting', 'flooring']);
  setQualityLevel('standard');
  setIncludePermits(true);
  setIncludeContingency(true);
  setContingencyPercent(15);
  setIncludeTempHousing(false);
  setIncludeArchitect(false);
  toast.success('Estimator reset');
};

// Add headerActions JSX
const headerActions = (
  <Button variant="ghost" size="sm" onClick={handleReset} className="gap-2">
    <RotateCcw className="h-4 w-4" />
    <span className="hidden sm:inline">Reset</span>
  </Button>
);
```

---

## Files to Be Modified

| File | Changes |
|------|---------|
| `src/components/tools/RentalIncomeCalculator.tsx` | **DELETE** |
| `src/App.tsx` | Remove line 161 (rental-yield redirect) |
| `src/components/profile/SavedCalculationsCompact.tsx` | Remove `rental_yield` case |
| `src/components/tools/PurchaseTaxCalculator.tsx` | Add Reset/Save header actions, imports, handlers |
| `src/components/tools/RenovationCostEstimator.tsx` | Add Reset header action, import RotateCcw, handler |

---

## Summary

After these changes:
- Dead code removed (RentalIncomeCalculator)
- All 6 active calculators + 1 estimator have consistent header actions
- No breaking changes to user-facing functionality
- Cleaner codebase with better uniformity

