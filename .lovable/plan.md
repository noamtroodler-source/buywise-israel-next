

## Root Cause

The affordability calculator performs all math using the user's input currency (USD when income is in USD). The resulting `maxPropertyLow` / `maxPropertyHigh` values are effectively in USD (~4,027,069 for a $4M budget). But the database stores property prices in **ILS**. So the query `price >= 4,027,069` returns ₪4M properties (~$1.1M) instead of ₪14.5M properties (~$4M).

The display looks correct because `formatCurrencyRange` just prints the raw number with a `$` symbol, while `formatPrice` divides by `exchangeRate` for other fields — but the underlying values are not in ILS.

## Fix

In `src/components/tools/AffordabilityCalculator.tsx` (lines 560-561), multiply the values by the exchange rate to convert back to ILS for the database query:

```tsx
// Before
minPrice={calculations.maxPropertyLow}
maxPrice={calculations.maxPropertyHigh}

// After  
minPrice={Math.round(calculations.maxPropertyLow * exchangeRate)}
maxPrice={Math.round(calculations.maxPropertyHigh * exchangeRate)}
```

`exchangeRate` is already defined on line 152 as `3.6` for USD, `1` for ILS. This converts the calculator's output back to ILS for the property query. When currency is ILS, the multiplication is a no-op.

Single line change, one file.

