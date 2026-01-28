

# Add Educational Tooltip to 12-Month Trend Card

## Overview

Add a subtle, educational tooltip to the "12-Month Trend" card in `PropertyValueSnapshot.tsx`. This will explain what the metric means and help buyers understand the context of the area's price movement.

---

## Implementation

### Changes to `PropertyValueSnapshot.tsx`

**1. Add Tooltip Imports**

```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
```

**2. Wrap Component in TooltipProvider**

The component already returns JSX directly, so we'll wrap the return statement content in `<TooltipProvider>`.

**3. Add Tooltip to 12-Month Trend Card**

Replace the static "12-Month Trend" label with a tooltip-enabled version:

```tsx
{/* 12-Month Trend */}
{priceChange !== null && priceChange !== undefined && (
  <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {priceChange > 0 ? (
        <TrendingUp className="h-4 w-4" />
      ) : priceChange < 0 ? (
        <TrendingDown className="h-4 w-4" />
      ) : (
        <Minus className="h-4 w-4" />
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="text-sm cursor-help border-b border-dotted border-muted-foreground/30">
            12-Month Trend
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium mb-1">Area Price Trend</p>
          <p className="text-xs text-muted-foreground">
            How much property prices in {city} have changed over the past 12 months, 
            based on government transaction data.
          </p>
        </TooltipContent>
      </Tooltip>
    </div>
    <p className="text-2xl font-bold text-foreground">
      {priceChange > 0 ? '+' : ''}{priceChange}%
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Area price change
    </p>
  </div>
)}
```

---

## Visual Result

**Before:**
```text
↗ 12-Month Trend
+1.8%
Area price change
```

**After (on hover):**
```text
↗ 12-Month Trend  ← dotted underline, cursor help
   ─────────────
+1.8%
Area price change

[Tooltip appears on hover:]
┌─────────────────────────────────────┐
│ Area Price Trend                    │
│ How much property prices in         │
│ Tel Aviv have changed over the      │
│ past 12 months, based on            │
│ government transaction data.        │
└─────────────────────────────────────┘
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/PropertyValueSnapshot.tsx` | Add Tooltip import, wrap in TooltipProvider, add tooltip to 12-Month Trend label |

---

## Design Consistency

This follows the established tooltip pattern from:
- `RecentNearbySales.tsx` - dotted underline triggers
- `PropertyCostBreakdown.tsx` - `cursor-help` and educational content
- Site-wide `border-b border-dotted border-muted-foreground/30` styling

