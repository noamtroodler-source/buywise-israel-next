
# Fix: Sticky Output Box Being Cut Off by Header

## Problem
The tool output boxes (right column) use `lg:sticky lg:top-6` (24px from top), but your header is 64px tall (`h-16`) and sticky. This causes the output box to scroll under the header and get cut off.

## Solution
Change `lg:top-6` to `lg:top-20` (80px) on all affected tool components. This matches your existing architecture standard for sticky sidebars clearing the 64px header with proper padding.

---

## Files to Update

### 1. `src/components/tools/shared/ToolLayout.tsx` (line 103)
```
Before: lg:sticky lg:top-6 lg:self-start
After:  lg:sticky lg:top-20 lg:self-start
```

### 2. `src/components/tools/PurchaseTaxCalculator.tsx` (line 333)
```
Before: lg:sticky lg:top-6 lg:self-start
After:  lg:sticky lg:top-20 lg:self-start
```

### 3. `src/components/tools/NewConstructionCostCalculator.tsx` (line 286)
```
Before: lg:sticky lg:top-6 lg:self-start
After:  lg:sticky lg:top-20 lg:self-start
```

### 4. `src/components/admin/PropertyPreviewModal.tsx` (line 497)
This one is inside a modal, so `top-6` is likely correct there (no global header overlap). **No change needed.**

---

## Summary

| File | Change |
|------|--------|
| `ToolLayout.tsx` | `top-6` → `top-20` |
| `PurchaseTaxCalculator.tsx` | `top-6` → `top-20` |
| `NewConstructionCostCalculator.tsx` | `top-6` → `top-20` |

**Effort**: 2 minutes  
**Impact**: All tool output boxes will now stay visible below the header when scrolling
