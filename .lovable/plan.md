
# Split AI Value Snapshot into Separate Cards (Purchase Listings)

## Problem
The current "Price vs. Market" card for purchase listings combines too much information in one box:
- Property price per m² (main value)
- City average price (sub-text)
- Comparison percentage badge

This feels dense compared to the rental AI Snapshot which uses 3 separate, clean cards (Total Monthly, City Avg, vs Market Rate).

## Solution
Split the purchase property AI Value Snapshot into 3 separate cards matching the rental pattern:

```text
Current (2 cards, one dense):
┌─────────────────────────────┐  ┌─────────────────────────┐
│ $ Price vs. Market          │  │ ↗ 12-Month Trend        │
│ ₪26,471/m²                  │  │ +5%                     │
│ Herzliya avg: ₪43,500/m²    │  │ Area price change       │
│ ↘ -39% below avg            │  │                         │
└─────────────────────────────┘  └─────────────────────────┘

Proposed (3 cards, clean):
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ $ This Property  │  │ 🏠 City Average  │  │ ↗ vs Market      │
│ ₪26,471/m²      │  │ ₪43,500/m²      │  │ -39%             │
│ Price per m²     │  │ Herzliya avg     │  │ Below average    │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## File to Modify
**`src/components/property/PropertyValueSnapshot.tsx`**

### Changes

**1. Update grid layout (line 178)**
Change from fixed 2-column to dynamic 3-column:
```tsx
// Count available cards dynamically
const hasPropertyPrice = !!propertyPricePerSqm;
const hasCityAvg = !!averagePriceSqm;
const hasComparison = purchaseComparisonPercent !== null;
const hasTrend = priceChange !== null && priceChange !== undefined;

const cardCount = [hasPropertyPrice, hasCityAvg || hasComparison, hasTrend].filter(Boolean).length;
const gridCols = cardCount === 3 
  ? 'grid-cols-1 sm:grid-cols-3' 
  : cardCount === 2
    ? 'grid-cols-1 sm:grid-cols-2'
    : 'grid-cols-1';
```

**2. Replace combined card (lines 188-227) with 3 separate cards:**

**Card 1: This Property (Price/m²)**
```tsx
{propertyPricePerSqm && (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <DollarSign className="h-4 w-4" />
      <span className="text-sm">This Property</span>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {formatPricePerArea(propertyPricePerSqm, 'ILS')}
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Price per m²
    </p>
  </div>
)}
```

**Card 2: City Average**
```tsx
{averagePriceSqm && (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      <Home className="h-4 w-4" />
      <span className="text-sm">{city} Average</span>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {formatPricePerArea(averagePriceSqm, 'ILS')}
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Market price per m²
    </p>
  </div>
)}
```

**Card 3: vs Market (Comparison %)**
```tsx
{purchaseComparisonPercent !== null && (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {purchaseComparisonPercent > 0 ? (
        <TrendingUp className="h-4 w-4" />
      ) : purchaseComparisonPercent < 0 ? (
        <TrendingDown className="h-4 w-4" />
      ) : (
        <Minus className="h-4 w-4" />
      )}
      <span className="text-sm">vs Market</span>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {purchaseComparisonPercent > 0 ? '+' : ''}{purchaseComparisonPercent}%
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      {purchaseComparisonPercent > 0 
        ? 'Above city average' 
        : purchaseComparisonPercent < 0 
          ? 'Below city average' 
          : 'At city average'}
    </p>
  </div>
)}
```

**3. Keep 12-Month Trend as separate 4th card** (unchanged, lines 229-249)

## Visual Result

After implementation:
```text
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ $ This Property  │  │ 🏠 Herzliya Avg  │  │ ↘ vs Market      │
│ ₪26,471/m²      │  │ ₪43,500/m²      │  │ -39%             │
│ Price per m²     │  │ Market price/m²  │  │ Below city avg   │
└──────────────────┘  └──────────────────┘  └──────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ 12-Month Trend (if available, spans or shows as 4th card)   │
└──────────────────────────────────────────────────────────────┘
```

## Notes
- If only some data is available, the grid auto-adjusts (same logic as rentals)
- Matches the visual rhythm and card density of the rental AI Snapshot
- Each metric is now scannable at a glance
- Removes the nested badge styling complexity
