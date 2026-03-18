

## Plan: Fix hardcoded "m²" labels to respect user's area unit preference

### Problem
Multiple user-facing components hardcode "m²" in labels regardless of whether the user has selected sqft. Example: the "This Property" card shows "$1,215/sqft" but subtitle says "Price per m²".

### Approach
Create a small `useAreaLabel` utility hook that returns dynamic strings, then replace all hardcoded instances in user-facing components.

### New utility (in `PreferencesContext.tsx`)
Add a `useAreaLabel()` hook returning:
- `perArea`: "per m²" or "per sqft"
- `slashArea`: "/m²" or "/sqft"
- `unit`: "m²" or "sqft"

### Files to update (user-facing only, skip admin tools)

| File | Hardcoded text | Fix |
|------|---------------|-----|
| `PropertyValueSnapshot.tsx` L224 | `"Price per m²"` | → `Price ${perArea}` |
| `CityMarketSnapshot.tsx` L67 | `'Price per m²'` | → `Price ${perArea}` |
| `RecentNearbySales.tsx` L147 | `"Similar price per m²"` | → `Similar price ${perArea}` |
| `RecentNearbySales.tsx` L155 | `"Price per m² Comparison"` | → `Price ${perArea} Comparison` |
| `RecentNearbySales.tsx` L158-161 | `"price per sqm"` in tooltips | → `price ${perArea}` |
| `RecentNearbySales.tsx` ~L560 | Same pattern duplicated for mobile | Same fixes |
| `RecentNearbySales.tsx` L482 | `"price/m²"` | → `price${slashArea}` |
| `MarketIntelligence.tsx` L90 | `"price/m²"` | → `price${slashArea}` |
| `Compare.tsx` L199 | `'Price/m²'` / `'Rent/m²'` | → `Price${slashArea}` / `Rent${slashArea}` |
| `Compare.tsx` L383 | `"price per m²"` | → `price ${perArea}` |
| `CompareUnitTypesSection.tsx` L201 | `"Price/m²"` | → `Price${slashArea}` |
| `PropertyValueSnapshot.tsx` L259 | `"price per m²"` in tooltip | → `price ${perArea}` |

### What stays unchanged (admin/developer tools — always ILS + sqm)
- `CityEditor.tsx` — admin form
- `UnitTypesPreview.tsx` — admin preview
- `ProjectPreviewDialog.tsx` — developer wizard
- `PropertyPreviewDialog.tsx` — agent wizard
- `ImportGovMapData.tsx` — admin import tool
- Guide pages (static editorial content)

