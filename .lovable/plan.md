
## Fix Currency Range Overflow on Mobile Tools

### The Problem

The screenshot shows `₪99.9M – ₪99.9M` displayed in the "Your Maximum Budget" hero result. This happens when both the low and high values of the range hit the ₪99.9M cap. The text overflows the card on mobile devices.

**Two issues:**
1. **Redundant display**: Showing `X – X` when both values are identical looks incorrect
2. **Text overflow**: Long currency ranges can overflow their container on narrow screens

---

### Solution

**1. Update `formatCurrencyRange` function** to return a single value when low equals high:
```tsx
// If values are the same, show single value (not redundant range)
if (low === high || Math.abs(low - high) < 1) {
  return `${currencySymbol}${formatCompact(low)}`;
}
return `${currencySymbol}${formatCompact(low)} – ${currencySymbol}${formatCompact(high)}`;
```

**2. Apply same logic to `ResultRange` component** for consistent behavior across all variants

**3. Add responsive text sizing** to the hero display in `AffordabilityCalculator.tsx`:
```tsx
// Change from fixed text-4xl md:text-5xl to responsive scaling
className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary"
```

**4. Audit other calculators** that use `formatCurrencyRange` for the same pattern

---

### Files to Modify

1. **`src/components/tools/shared/ResultRange.tsx`**
   - Update `formatCurrencyRange` to handle equal values
   - Update `ResultRange` component with same logic
   - Reduce hero variant text size on mobile: `text-3xl sm:text-4xl md:text-5xl`

2. **`src/components/tools/AffordabilityCalculator.tsx`**
   - Update hero text size class: `text-3xl sm:text-4xl md:text-5xl`

3. **`src/components/tools/MortgageCalculator.tsx`**
   - Update hero text size class for consistency

---

### Expected Behavior After Fix

| Condition | Before | After |
|-----------|--------|-------|
| Range: ₪2.5M – ₪3.1M | `₪2.5M – ₪3.1M` | `₪2.5M – ₪3.1M` (no change) |
| Same value: ₪99.9M – ₪99.9M | `₪99.9M – ₪99.9M` | `₪99.9M` (single value) |
| Close values: ₪2,500,000 – ₪2,500,100 | `₪2.5M – ₪2.5M` | `₪2.5M` (single value) |

---

### Technical Details

The check `Math.abs(low - high) < 1` handles floating-point edge cases where values are essentially equal but not exactly identical due to calculation rounding.

The responsive text sizing progression:
- Mobile (<640px): `text-3xl` = 1.875rem (30px)
- Small tablet (≥640px): `text-4xl` = 2.25rem (36px) 
- Desktop (≥768px): `text-5xl` = 3rem (48px)
