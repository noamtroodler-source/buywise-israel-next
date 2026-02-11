

# Replace Transparent Semantic Colors with Solid Colors Site-Wide

## What's Changing

Every badge, indicator, and highlight that currently uses faded/transparent semantic colors (like `bg-semantic-green/10 text-semantic-green`) will be updated to use solid backgrounds with white text (like `bg-semantic-green text-white`), matching the style you approved on the mortgage risk badges.

## Files to Update

### Tools (3 files)

| File | What Changes |
|------|-------------|
| `src/components/tools/shared/LTVIndicator.tsx` | LTV status badge: solid green/amber/red with white text |
| `src/components/tools/RentVsBuyCalculator.tsx` | Buy vs rent verdict box: solid green or amber bg with white text |
| `src/components/tools/InvestmentROICalculator.tsx` | Yield benchmark alert: solid green or red bg with white text |

### Property Listings (6 files)

| File | What Changes |
|------|-------------|
| `src/components/property/AffordabilityBadge.tsx` | Comfortable/Stretch/Over Budget badges: solid colors |
| `src/components/property/RentalBudgetBadge.tsx` | Within/Over Budget badge: solid green or red |
| `src/components/property/PropertyQuickSummary.tsx` | Price drop (green), price increase (amber), freshness badges: all solid |
| `src/components/property/PropertyCard.tsx` | Same badges on cards: solid colors |
| `src/components/property/PropertyInvestmentScore.tsx` | Appreciation potential badge + recommendation box: solid colors |
| `src/components/property/RecentNearbySales.tsx` | Market verdict badges + comparison badges: solid colors |

### Projects (1 file)

| File | What Changes |
|------|-------------|
| `src/components/project/ProjectQuickSummary.tsx` | Status badges (Under Construction = amber, Ready = green): solid |

## The Pattern

Every instance follows the same swap:

**Before:** `bg-semantic-green/10 text-semantic-green border-semantic-green/20`
**After:** `bg-semantic-green text-semantic-green-foreground border-semantic-green`

The `*-foreground` CSS variables are already defined in the CSS (white for green/red, dark for amber), so text contrast will be handled automatically.

Total: 10 files, all class name replacements only -- no logic changes.

