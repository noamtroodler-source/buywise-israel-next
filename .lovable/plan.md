
# Add Contextual Property Recommendations to Calculator Tools

## Overview
Add a "Properties at This Price" section to the bottom of 4 calculator tools, showing 4 real property cards that match the user's calculated/entered values. Properties appear **after the user interacts** with the calculator (changes values from defaults), creating a personalized feel. Each section includes a "See all" link to the full search with pre-applied filters.

## What Gets Built

### 1. New Shared Component: `ToolPropertySuggestions`
A reusable component in `src/components/tools/shared/` that:
- Accepts `minPrice`, `maxPrice`, and an optional `listingStatus` filter
- Queries the `properties` table for published listings within that price range (using a +/-20% range to ensure results)
- Displays 4 `PropertyCard` components in a responsive grid (1 col mobile, 2 col tablet, 4 col desktop)
- Shows a skeleton loader while fetching
- Includes a header like "Properties in Your Budget" with a contextual subtitle
- Has a "See all properties" link that navigates to `/listings` with pre-applied `min_price` and `max_price` query params
- Returns `null` if no properties match (graceful fallback)
- Only renders when `enabled` prop is true (tied to user interaction)

### 2. New Hook: `useToolPropertySuggestions`
A lightweight query hook in `src/hooks/` that:
- Takes `minPrice`, `maxPrice`, `listingStatus`, and `enabled`
- Queries `properties` table filtered by price range, `is_published = true`, `listing_status = 'for_sale'`
- Limits to 4 results, ordered by most recent
- Uses a stable query key based on rounded price values to avoid excessive re-fetching

### 3. Integration into 4 Calculators

Each calculator appends the `ToolPropertySuggestions` component at the end of its existing `bottomSection`:

| Calculator | Trigger | Price Filter | Section Title |
|---|---|---|---|
| **Affordability** | `maxPropertyPrice` differs from default | `0` to `maxPropertyPrice` | "Properties in Your Budget" |
| **Mortgage** | `propertyPrice` differs from default | `propertyPrice` +/- 20% | "Homes at This Price Point" |
| **True Cost** | `propertyPrice` differs from default | `propertyPrice` +/- 20% | "Properties at This Price" |
| **Rent vs Buy** | User has interacted | `propertyPrice` +/- 20% for sale | "Properties at This Price" |

## Technical Details

### Files to Create
- `src/hooks/useToolPropertySuggestions.ts` -- query hook
- `src/components/tools/shared/ToolPropertySuggestions.tsx` -- shared UI component

### Files to Modify
- `src/components/tools/shared/index.ts` -- export new component
- `src/components/tools/AffordabilityCalculator.tsx` -- add suggestions to bottomSection
- `src/components/tools/MortgageCalculator.tsx` -- add suggestions to bottomSection
- `src/components/tools/TrueCostCalculator.tsx` -- add suggestions to bottomSection
- `src/components/tools/RentVsBuyCalculator.tsx` -- add suggestions to bottomSection

### Component Design
- Reuses existing `PropertyCard` with `compact` and `showCompareButton={false}` props (same pattern as `SimilarProperties`)
- Uses Embla carousel on mobile (consistent with rest of app), grid on desktop
- "See all" button links to `/listings?min_price=X&max_price=Y` so users land on a filtered search
- Section appears with a subtle fade-in animation (framer-motion, matching existing patterns)

### Query Strategy
- Price range uses +/-20% of target price to ensure enough results
- Rounds prices to nearest 100K for query key stability (avoids re-fetch on tiny slider changes)
- 30-second stale time to avoid excessive API calls as users adjust inputs
- `enabled` flag prevents queries until user has actually interacted with the calculator
