

## Fix: Affordability Calculator Property Suggestions Range

**Problem:** `minPrice={0}` means it fetches properties from ₪0 up to the max budget, returning cheap irrelevant listings.

**Fix:** In `src/components/tools/AffordabilityCalculator.tsx` line 560, change:
```
minPrice={0}
```
to:
```
minPrice={Math.round(calculations.maxPropertyPrice * 0.7)}
```

This shows properties in the top 30% of their budget range (e.g., ₪10.5M–15M for a ₪15M budget), consistent with how other calculators (TrueCost, Mortgage, RentVsBuy) already use `* 0.8` ranges.

Single line change, one file.

