

# Semantic Color Audit: Add Green/Yellow/Red Traffic-Light Colors Across the Platform

## Overview

Currently, the site uses blue (primary) for positive signals, muted gray for neutral, and occasionally amber/destructive for warnings. This works but makes it harder to quickly parse "good vs. okay vs. bad" at a glance. This plan introduces a cohesive set of semantic green, amber, and red shades that fit the existing blue-neutral palette, then applies them everywhere they add clarity.

## Step 1: Define Semantic Color Tokens in CSS

Add three semantic color sets to `src/index.css` that harmonize with the existing HSL-based blue palette:

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--semantic-green` | `152 60% 36%` (muted teal-green) | `152 55% 45%` | Good / favorable / within budget |
| `--semantic-amber` | `38 92% 50%` (warm gold) | `38 85% 55%` | Caution / moderate / stretch |
| `--semantic-red` | `0 72% 51%` (muted crimson) | `0 65% 55%` | Bad / over budget / high risk |

These are deliberately muted/desaturated compared to pure green/yellow/red, matching the site's professional tone.

Also add corresponding Tailwind utility classes in the config or as CSS utilities:
- `text-semantic-green`, `bg-semantic-green/10`, `border-semantic-green/20`
- `text-semantic-amber`, `bg-semantic-amber/10`, `border-semantic-amber/20`
- `text-semantic-red`, `bg-semantic-red/10`, `border-semantic-red/20`

## Step 2: Component-by-Component Changes

### Property Listing Pages

**AffordabilityBadge** (`src/components/property/AffordabilityBadge.tsx`)
- "Comfortable" = green icon + green text/bg (currently blue)
- "Stretch" = amber icon + amber text/bg (currently gray)
- "Over Budget" = red icon + red text/bg (currently gray)

**PropertyInvestmentScore** (`src/components/property/PropertyInvestmentScore.tsx`)
- Score 7-10 = green text + green progress bar
- Score 5-6 = amber text + amber progress bar (currently blue/50)
- Score 1-4 = red text + red progress bar (currently muted)
- "High Potential" badge = green, "Medium" = amber, "Low" = red
- "Price vs City Avg": below market = green text, above = red text
- Recommendation box: strong opportunity = green bg, solid = amber, concerns = red

**PropertyValueSnapshot** (`src/components/property/PropertyValueSnapshot.tsx`)
- "vs Market Rate" / "vs City Average" comparison:
  - Negative % (below market) = green icon + text
  - Near zero = neutral
  - Positive % (above market) = red icon + text
- "12-Month Trend": positive = green, negative = red

**RecentNearbySales Market Verdict** (`src/components/property/RecentNearbySales.tsx`)
- "Priced in line" / "Below average" = green badge (currently blue)
- "Above average" = amber badge (already amber -- keep)
- "Significantly above" = red badge (currently destructive -- use semantic-red)
- Comparison badges per comp: "below this sale" = green, "above this sale" = red (currently all blue)

**RentalBudgetBadge** (`src/components/property/RentalBudgetBadge.tsx`)
- "Within Budget" = green (currently blue)
- "Over Budget" = red (currently amber -- strengthen)

**PropertyQuickSummary** (`src/components/property/PropertyQuickSummary.tsx`)
- Price Drop badge = green (currently blue) -- good news for buyers
- Price Increase badge = amber (already amber -- keep)
- Freshness: "hot" stays amber, "fresh" = green (currently blue)
- Condition "Brand New" / "Recently Renovated" highlights: keep neutral

**PropertyCard** (`src/components/property/PropertyCard.tsx`)
- Price drop badge = green
- Price increase badge = amber
- Same freshness logic as QuickSummary

### Tools

**MortgageCalculator** (`src/components/tools/MortgageCalculator.tsx`)
- Mortgage track risk badges: low = green, medium = amber, high = red (currently all same variant)
- Stress test: +1% increase text = amber, +2% = red (currently both blue)

**RentVsBuyCalculator** (`src/components/tools/RentVsBuyCalculator.tsx`)
- Break-even verdict text:
  - <=7 years: "Buying wins quickly" = green
  - 7-12 years: "Consider carefully" = amber
  - 12+: "Long horizon needed" = red
- Bottom verdict: "Buying builds more wealth" = green bg, "Renting saves" = amber bg (currently blue vs gray)

**InvestmentROICalculator** (`src/components/tools/InvestmentROICalculator.tsx`)
- Yield vs benchmark: above benchmark = green, below = red (currently all blue/primary)
- Cash flow: positive annual cash flow = green, negative = red
- ROI projection: positive = green, negative = red

**ReadinessCheckTool** (`src/components/tools/ReadinessCheckTool.tsx`)
- Strengths list: green checkmarks (currently blue)
- Gaps list: amber/red indicators

**DocumentChecklist** (`src/components/tools/DocumentChecklist.tsx`)
- Progress bar: changes color as it fills (red < 33%, amber 33-66%, green > 66%)
- Category completion checkmark: green (currently blue)
- 100% complete message: green text

### Project Pages

**ProjectTimeline** (`src/components/project/ProjectTimeline.tsx`)
- Completed stages: green dots/checkmarks (currently blue)
- Current stage: amber/primary ring
- Future stages: gray (unchanged)

**ProjectQuickSummary** (`src/components/project/ProjectQuickSummary.tsx`)
- Status badges: "Ready to Move In" = green, "Under Construction" = amber, "Planning" = neutral

### City/Area Pages

- YoY price change: positive trend = green, negative = red
- Yield comparisons: above national avg = green, below = red

## Step 3: What NOT to Change

- Primary navigation and branding elements stay blue
- CTA buttons stay primary blue
- Links and interactive hover states stay blue
- Stars, trophies, achievement badges stay blue per existing standards
- Section headers and icons stay primary blue
- The amber "warning" semantic use for actual warnings (tax alerts, budget cautions) stays

## Files Changed

| File | Nature of Change |
|------|-----------------|
| `src/index.css` | Add 3 semantic color CSS custom properties (light + dark) |
| `tailwind.config.ts` | Add `semantic` color entries mapping to CSS vars |
| `src/components/property/AffordabilityBadge.tsx` | Green/amber/red for comfortable/stretch/over-budget |
| `src/components/property/PropertyInvestmentScore.tsx` | Green/amber/red for score tiers, trend icons, recommendation |
| `src/components/property/PropertyValueSnapshot.tsx` | Green/red for market comparison percentages |
| `src/components/property/RecentNearbySales.tsx` | Green for "below/in-line", red for "above" comps |
| `src/components/property/RentalBudgetBadge.tsx` | Green for within budget, red for over |
| `src/components/property/PropertyQuickSummary.tsx` | Green price drop badge, green "fresh" freshness |
| `src/components/property/PropertyCard.tsx` | Green price drop, amber price increase |
| `src/components/tools/MortgageCalculator.tsx` | Green/amber/red risk badges, stress test colors |
| `src/components/tools/RentVsBuyCalculator.tsx` | Break-even and verdict color coding |
| `src/components/tools/InvestmentROICalculator.tsx` | Yield/cash-flow/ROI color coding |
| `src/components/tools/ReadinessCheckTool.tsx` | Green strengths, amber gaps |
| `src/components/tools/DocumentChecklist.tsx` | Progress bar + completion colors |
| `src/components/project/ProjectTimeline.tsx` | Green completed stages |
| `src/components/project/ProjectQuickSummary.tsx` | Status badge colors |

Total: ~16 files, primarily class name changes from `text-primary` / `bg-primary/10` to the appropriate semantic color.

