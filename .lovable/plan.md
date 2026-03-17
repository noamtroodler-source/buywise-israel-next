

## Remove Investment Score from City Comparison

One-line change in `src/components/city/CityComparison.tsx` — remove the `investment_score` entry from the `metrics` array (lines ~36-41).

No other files need changes. The field stays in the database and admin editor for internal use, just won't show in the public comparison table.

