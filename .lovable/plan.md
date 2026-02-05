

# Add Back Button to All Guide Pages

## Overview

Currently, only `BuyingInIsraelGuide` has a back button to return to the guides listing. All other guides (11 total) are missing this navigation, which can leave users feeling "trapped" on a guide page without an obvious way to browse other guides.

## Strategic Placement

The back button should appear in the **top-left corner**, integrated into the hero section. Two approaches work well with the existing designs:

| Guide Style | Placement Strategy |
|-------------|-------------------|
| Full-bleed hero image (RentVsBuy) | Floating button over the image, top-left of container |
| Gradient hero (TrueCost, Mortgages) | Above the hero content, left-aligned |

## Design Pattern

Using the existing pattern from `BuyingInIsraelGuide`:

```text
[ ← Back to Guides ]     <- Ghost button with arrow icon
```

- Uses `Button variant="ghost"` with `ArrowLeft` icon
- Links directly to `/guides`
- Positioned at container level, above or at start of hero content
- Works on both mobile and desktop

## Files to Modify

| File | Current State | Change |
|------|---------------|--------|
| `src/pages/guides/MortgagesGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/TrueCostGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/RentVsBuyGuide.tsx` | No back button | Add floating back button in hero |
| `src/pages/guides/ListingsGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/PurchaseTaxGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/NewVsResaleGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/TalkingToProfessionalsGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/NewConstructionGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/OlehBuyerGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/InvestmentPropertyGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/BuyingPropertyGuide.tsx` | No back button | Add back button above hero content |
| `src/pages/guides/BuyingInIsraelGuide.tsx` | Already has back button | No change needed |

## Implementation Details

### Import Addition
Each file will need `ArrowLeft` added to the lucide-react import (if not already present) and ensure `Button` is imported.

### Code Pattern
For gradient-style heroes (most guides):
```jsx
<div className="container relative py-12 md:py-16">
  {/* Back Button - Added */}
  <Link to="/guides">
    <Button variant="ghost" className="gap-2 -ml-2 mb-4">
      <ArrowLeft className="h-4 w-4" />
      Back to Guides
    </Button>
  </Link>
  
  {/* Existing hero content */}
  <motion.div ...>
```

For full-bleed image heroes (RentVsBuyGuide):
```jsx
<div className="container relative h-full flex flex-col justify-end pb-12">
  {/* Back Button - Positioned at top */}
  <Link to="/guides" className="absolute top-6 left-0">
    <Button variant="ghost" className="gap-2 bg-background/80 backdrop-blur-sm hover:bg-background/90">
      <ArrowLeft className="h-4 w-4" />
      Back to Guides
    </Button>
  </Link>
  
  {/* Existing hero content */}
  <motion.div ...>
```

## Visual Result

Before:
```text
┌─────────────────────────────────────────┐
│ [Hero Section - No back navigation]      │
│                                          │
│   Essential Guide                        │
│   Mortgages in Israel                    │
```

After:
```text
┌─────────────────────────────────────────┐
│ ← Back to Guides                         │  <- Consistent navigation
│                                          │
│   Essential Guide                        │
│   Mortgages in Israel                    │
```

## User Experience

- Users can easily return to browse other guides
- Consistent with the back button pattern already used in `BuyingInIsraelGuide`
- Matches the `MobileHeaderBack` pattern used elsewhere in the app
- Non-intrusive positioning that doesn't compete with guide content

