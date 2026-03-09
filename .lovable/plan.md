

# Investment Return Calculator — Design Polish Plan

## What Changes

### 1. Add `ExampleValuesHint` above inputs
Every other calculator shows this hint. Add it at the top of the left column, before the first Card.

### 2. Add info banner explaining investor tax assumption
Other calculators use `BuyerTypeInfoBanner`. This calculator always assumes investor status. Add a static `InfoBanner` (variant="info") stating: "This calculator applies the 8% investor purchase tax bracket. First-time buyer or Oleh? Use the Purchase Tax Calculator instead."

### 3. Add Reset button to header
All other calculators have `headerActions` with a Reset button (ghost variant, `RotateCcw` icon). Add the same pattern here, resetting the form to defaults.

### 4. Fix hardcoded `₪/yr` labels → use `currencySymbol`
Three places use hardcoded `₪/yr` in FormLabels (Total Annual Expenses, Arnona, Vaad Bayit, Insurance). Replace with dynamic `{currencySymbol}/yr`. Also update the Lawyer label from `~₪10k + VAT` to use `currencySymbol`.

### 5. CAGR badge → primary brand color instead of traffic-light
Per memory `calculator-verdict-branding`, the hero result should use `text-primary`/`bg-primary` regardless of outcome. Change the `cagrBadge` to always use a neutral primary-styled badge (e.g., "Beats Market" / "Market-Level" / "Below Market" text but with `bg-primary/10 text-primary border-primary/20` styling instead of success/warning/danger).

### 6. Replace `BarChart3` icon with `TrendingUp` for the tool header
Use a more investment-specific icon. `TrendingUp` fits better than the generic chart icon.

### 7. Add `ⓘ` tooltips to key inputs
Add tooltips to: Purchase Price ("Total price including VAT if applicable"), Monthly Rent ("Expected gross monthly rent before expenses"), Down Payment ("Minimum 25% for investment properties in Israel").

### 8. Add `SaveResultsPrompt` + save trigger
All other calculators use `useSavePromptTrigger` and `SaveResultsPrompt`. Wire the same pattern so users get prompted to save results.

### 9. Results grid density refinement
Add subtle separators between the 2x2 metrics grid and the Day-One Cash card using spacing and a thin divider, matching the visual rhythm of other calculators.

## Files to Edit
- `src/components/tools/InvestmentReturnCalculator.tsx` — all changes in this single file

## No Breaking Changes
All changes are visual/UX polish. The calculation engine remains untouched.

