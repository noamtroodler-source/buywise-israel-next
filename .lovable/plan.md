
# Unify Price Tier Badge Colors to BuyWise Brand Blue

## Current Issue
The price tier badges (Budget-friendly, Mid-range, Premium, Ultra-premium) currently use different colors:
- Budget: Emerald green
- Mid-range: Blue
- Premium: Amber/Gold
- Ultra-premium: Purple

## Brand Standard
Per the project's color palette standards (memory: `style/color-palette-standards-v3`), all badges should use the uniform primary blue styling to maintain brand consistency, exactly like `QuestionCategoryBadge.tsx` does.

## Solution
Update `priceTierConfig` in `CityNeighborhoodHighlights.tsx` to use a single uniform blue style for all price tiers:

```typescript
// Before: Different colors per tier
const priceTierConfig = {
  'budget': { className: 'bg-emerald-500/10 text-emerald-700...' },
  'mid-range': { className: 'bg-blue-500/10 text-blue-700...' },
  'premium': { className: 'bg-amber-500/10 text-amber-700...' },
  'ultra-premium': { className: 'bg-purple-500/10 text-purple-700...' },
};

// After: Uniform brand blue for all
const uniformBadgeStyle = 'bg-primary/10 text-primary border-primary/20';

const priceTierConfig = {
  'budget': { label: 'Budget-friendly', className: uniformBadgeStyle },
  'mid-range': { label: 'Mid-range', className: uniformBadgeStyle },
  'premium': { label: 'Premium', className: uniformBadgeStyle },
  'ultra-premium': { label: 'Ultra-premium', className: uniformBadgeStyle },
};
```

## File Changed
- `src/components/city/CityNeighborhoodHighlights.tsx` (lines 13-30)

## Result
All four price tier badges will display with the consistent primary blue styling:
- Background: `bg-primary/10` (light blue tint)
- Text: `text-primary` (brand blue)
- Border: `border-primary/20` (subtle blue border)

This matches the pattern already used in `QuestionCategoryBadge.tsx` and aligns with the BuyWise Israel brand guidelines.
