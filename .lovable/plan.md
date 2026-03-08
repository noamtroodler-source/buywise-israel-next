

## Fix: Use Budget Range for Property Suggestions

**Problem:** `minPrice={Math.round(calculations.maxPropertyPrice * 0.7)}` is still too broad. The calculator already computes `maxPropertyLow` and `maxPropertyHigh` (the displayed budget range based on rate variance). Property suggestions should match this range exactly.

**Change** in `src/components/tools/AffordabilityCalculator.tsx` line 560-561:

```
// Before
minPrice={Math.round(calculations.maxPropertyPrice * 0.7)}
maxPrice={calculations.maxPropertyPrice}

// After
minPrice={calculations.maxPropertyLow}
maxPrice={calculations.maxPropertyHigh}
```

This ensures suggestions match the displayed budget range (e.g., ₪15M–₪16M) instead of an arbitrary 70% floor.

Single line change, one file.

