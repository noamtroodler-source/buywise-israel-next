

## Cleanup: Remove Dead Code in ActiveFilterChips

### What was found

After reviewing all three recently implemented features (Price/m2 + days on market, Active filter chips, Result count breakdown), everything is functioning correctly with one minor code quality issue:

In `ActiveFilterChips.tsx`, lines 29-34 build a `parts` array that is never actually used. The display label is computed separately on lines 35-39. This dead code should be removed for cleanliness.

### Changes

**File: `src/components/map-search/ActiveFilterChips.tsx`**

Remove the unused `parts` array construction (lines 29-34) inside the price range chip builder. The `label` variable already handles all cases correctly.

Before:
```text
if (filters.min_price || filters.max_price) {
    const parts: string[] = [];
    if (filters.min_price) parts.push(formatCompact(filters.min_price, currency));
    parts.push('--');
    if (filters.max_price) parts.push(formatCompact(filters.max_price, currency));
    else parts.push('Any');
    if (!filters.min_price) parts.unshift('Up to');
    const label = filters.min_price && filters.max_price
      ...
```

After:
```text
if (filters.min_price || filters.max_price) {
    const label = filters.min_price && filters.max_price
      ...
```

No other changes needed -- all three features are properly implemented and integrated across desktop and mobile views.

