
# Reduce AI Value Snapshot to 3 Cards (Purchase Listings)

## Problem
The current AI Value Snapshot for purchase listings shows 4 cards:
1. This Property (₪26,471/m²)
2. City Average (₪43,500/m²)
3. vs Market (-39%)
4. 12-Month Trend (+7.5%)

This is too much visual clutter - you want a maximum of 3 cards.

## Solution
Combine "City Average" and "vs Market" into a single card since they're directly related (the percentage IS the comparison to city average). This gives us:

```text
Before (4 cards):
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ $ This Property  │  │ 🏠 City Average  │  │ ↘ vs Market      │
│ ₪26,471/m²      │  │ ₪43,500/m²      │  │ -39%             │
└──────────────────┘  └──────────────────┘  └──────────────────┘
┌──────────────────┐
│ ↗ 12-Month Trend │
│ +7.5%            │
└──────────────────┘

After (3 cards):
┌──────────────────┐  ┌────────────────────────┐  ┌──────────────────┐
│ $ This Property  │  │ 🏠 vs City Average     │  │ ↗ 12-Month Trend │
│ ₪26,471/m²      │  │ -39%                   │  │ +7.5%            │
│ Price per m²     │  │ Herzliya: ₪43,500/m²  │  │ Area price change│
└──────────────────┘  └────────────────────────┘  └──────────────────┘
```

## File to Modify
`src/components/property/PropertyValueSnapshot.tsx`

## Changes

### 1. Update card counting logic (lines 171-185)
Remove `hasCityAvg` as a separate condition since it will be merged with `hasComparison`:

```tsx
const hasPropertyPrice = !!propertyPricePerSqm;
const hasComparison = purchaseComparisonPercent !== null && averagePriceSqm;
const hasTrend = priceChange !== null && priceChange !== undefined;

if (!hasPropertyPrice && !hasComparison && !hasTrend) return null;

const cardCount = [hasPropertyPrice, hasComparison, hasTrend].filter(Boolean).length;
const gridCols = cardCount === 3 
  ? 'grid-cols-1 sm:grid-cols-3' 
  : cardCount === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1';
```

### 2. Remove the standalone "City Average" card (lines 211-225)
Delete this entire block.

### 3. Modify "vs Market" card to include city average info (lines 227-251)
Change the card to show the percentage as the main value, with the city average as supporting context:

```tsx
{purchaseComparisonPercent !== null && averagePriceSqm && (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {purchaseComparisonPercent > 0 ? (
        <TrendingUp className="h-4 w-4" />
      ) : purchaseComparisonPercent < 0 ? (
        <TrendingDown className="h-4 w-4" />
      ) : (
        <Minus className="h-4 w-4" />
      )}
      <span className="text-sm">vs {city} Average</span>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {purchaseComparisonPercent > 0 ? '+' : ''}{purchaseComparisonPercent}%
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      {city}: {formatPricePerArea(averagePriceSqm, 'ILS')}
    </p>
  </div>
)}
```

### 4. Keep "12-Month Trend" card unchanged (lines 253-273)

## Visual Result
A clean 3-card layout:
- **Card 1 - This Property**: Shows this listing's price per m²
- **Card 2 - vs City Average**: Shows the comparison percentage with city avg as subtext
- **Card 3 - 12-Month Trend**: Shows area price trend

## Why This Approach
- The city average and comparison percentage are redundant when separate - you need both to understand either
- Combining them keeps all the information but in one scannable card
- The trend data is independent and valuable for investment decisions, so it stays separate
- Matches the 3-card pattern used in rentals (Total Monthly, City Avg, vs Market Rate)
