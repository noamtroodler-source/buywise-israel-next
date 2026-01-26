
# Convert Green Indicators to Blue Branding

## Overview
Replace all green/emerald color styling with primary blue to match the established branding guidelines.

## Files to Update

### 1. `src/components/city/PriceTrendsSection.tsx`
**Line 115** - YoY Change percentage
- Change: `text-emerald-600` → `text-primary`

**Line 220** - Total Growth badge (the one in your screenshot)
- Change: `bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400`
- To: `bg-primary/10 text-primary`

### 2. `src/components/city/MarketRealityTabs.tsx`
**Line 157** - Percent vs national average (favorable)
- Change: `text-emerald-600` → `text-primary`

**Line 168** - Affordability slider gradient
- Change: `from-emerald-500` → `from-primary`

**Line 406** - Arnona vs national (favorable)
- Change: `text-emerald-600` → `text-primary`

### 3. `src/components/city/CityComparison.tsx`
**Line 85** - Best value cell highlight
- Change: `bg-emerald-50 dark:bg-emerald-950/30` → `bg-primary/10 dark:bg-primary/20`

**Line 93** - Crown icon for best value
- Change: `text-emerald-600` → `text-primary`

**Line 197** - Best value indicator text
- Change: `text-emerald-600` → `text-primary`

### 4. `src/components/city/AngloFriendlinessScore.tsx`
**Line 19** - High Anglo Presence badge
- Change: `bg-emerald-100 text-emerald-700 border-emerald-200`
- To: `bg-primary/10 text-primary border-primary/20`

### 5. `src/components/city/CityArnonaCard.tsx`
**Line 120** - Favorable arnona comparison
- Change: `text-emerald-600` → `text-primary`

### 6. `src/components/tools/TrueCostCalculator.tsx`
**Line 475** - Price below market indicator
- Change: `text-emerald-600` → `text-primary`

### 7. `src/components/city/PriceTrendChart.tsx`
**Line 22** - Chart line color
- Change: `'hsl(152 69% 40%)'` (emerald) → `'hsl(221 83% 53%)'` (primary blue)

### 8. `src/components/property/RentalBudgetBadge.tsx`
**Lines 48, 75, 91** - Within budget indicators
- Change green classes to primary blue styling

### 9. Admin Components (lower priority but included for consistency)
**`src/pages/admin/AdminAccuracyAudit.tsx`**
- Lines 153, 197 - "No Issues" / "OK" indicators

**`src/components/admin/PropertyPreviewModal.tsx`**
**`src/components/admin/ListingReviewCard.tsx`**
- "Approved" status badges

**`src/components/developer/DeveloperOnboardingProgress.tsx`**
- Completed step styling

## Color Mapping Reference

| Old Green Class | New Blue Class |
|----------------|----------------|
| `text-emerald-600` | `text-primary` |
| `bg-emerald-100` | `bg-primary/10` |
| `text-emerald-700` | `text-primary` |
| `border-emerald-200` | `border-primary/20` |
| `bg-emerald-50` | `bg-primary/5` or `bg-primary/10` |
| `dark:bg-emerald-900/30` | (remove - primary handles dark mode) |
| `dark:text-emerald-400` | (remove - primary handles dark mode) |
| `text-green-600/700` | `text-primary` |
| `bg-green-100` | `bg-primary/10` |

## Result
All positive/favorable indicators will use consistent primary blue styling instead of green, matching the established design system and branding guidelines.
