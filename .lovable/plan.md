

## Issue: Property carousel not showing

The `enabled` prop on `ToolPropertySuggestions` is set to:
```
enabled={propertyPrice !== formatNumber(DEFAULTS.propertyPrice)}
```

This means the carousel is **disabled** whenever the property price equals the default value (`2,750,000`). Since the calculator initializes with defaults, the carousel never appears unless the user manually changes the price.

## Fix

Change the `enabled` condition to simply check that `calculations` exist (which is already guarded by the outer `{calculations && ...}`), making the carousel always visible when results are shown:

**File:** `src/components/tools/RentVsBuyCalculator.tsx` (line 1186)

Replace:
```tsx
enabled={propertyPrice !== formatNumber(DEFAULTS.propertyPrice)}
```
With:
```tsx
enabled={!!calculations}
```

This way the carousel shows whenever the calculator has results, regardless of whether the user changed the price from defaults.

