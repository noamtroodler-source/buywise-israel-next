
Plan: collapse degenerate ranges across all calculators.

**The fix**

Update `ResultRange` (`src/components/tools/shared/ResultRange.tsx`) — the shared component already used by all calculators — to detect when `low` and `high` format to the same display string, and render a single value instead of `"X – X"`.

```tsx
const lowFormatted = formatValue(low, format, currencySymbol);
const highFormatted = formatValue(high, format, currencySymbol);
const isDegenerate = lowFormatted === highFormatted 
  || Math.abs(high - low) / Math.max(low, high, 1) < 0.02; // within 2%
const displayText = isDegenerate ? lowFormatted : `${lowFormatted} – ${highFormatted}`;
```

This is a one-component fix that automatically covers every calculator using `ResultRange` (Affordability, True Cost, Mortgage, Investment Return, Rent vs Buy).

**Also check `formatCurrencyRange` / `formatPercentageRange`** helpers in the same file and `src/lib/utils/formatRange.ts` (`formatPriceRange`, `formatMonthlyRange`, `formatPercentRange`) — apply the same collapse logic so any direct string callers also benefit.

**Build errors** — the listed TS/Deno errors are unrelated to this fix (pre-existing in duplicate-check hook, wizards, edge function imports). I'll leave them untouched unless you want them addressed separately.

**Scope**
1. `src/components/tools/shared/ResultRange.tsx` — collapse logic in component + both helpers
2. `src/lib/utils/formatRange.ts` — collapse logic in `formatPriceRange`, `formatMonthlyRange`, `formatPercentRange`

Threshold: same rounded display string OR <2% spread. Both signal "no meaningful range."
