

# Fix Market Verdict Badge Colors & Layout

## Problem
The current "Market Verdict Summary" in the Recent Nearby Sales section:
1. **Uses green colors** (emerald) which doesn't align with BuyWise Israel's blue-based brand palette
2. **Wastes horizontal space** — the badge sits in a full-width bar with empty space to the right

## Solution

### 1. Replace Colors with Brand-Compliant Palette
Following the color-palette-standards-v3 memory:

| Verdict | Current | New (Brand-Compliant) |
|---------|---------|----------------------|
| Favorable (in-line, below market) | `emerald-500` | `primary` blue |
| Caution (above average) | `amber-500` | `warning` amber (stays same) |
| Negative (significantly above) | `rose-500` | `destructive` rose (stays same) |

**The key change**: Green → Primary Blue for positive/favorable indicators.

### 2. Compact Inline Badge Layout
Move the verdict from a full-width bar to a **small inline badge** positioned between the section header and the comp cards:

**Before:**
```
Recent Nearby Sales               Last 24 months
+--------------------------------------------+
|  [Badge: Priced in line]          [i]      |  ← Full width, wasted space
+--------------------------------------------+
[Comp card 1]
[Comp card 2]
```

**After:**
```
Recent Nearby Sales               Last 24 months
[Priced in line with recent sales] ← Small inline text/badge, no container
[Comp card 1]
[Comp card 2]
```

Just a small badge with an info icon, no wrapper box.

## File Changes

| File | Change |
|------|--------|
| `src/components/property/RecentNearbySales.tsx` | Update badge colors from emerald to primary blue; remove full-width container and make it an inline element |

## Implementation Details

Replace lines 395-430 in `RecentNearbySales.tsx`:

```tsx
{/* Compact Market Verdict - inline badge */}
{avgComparison !== null && (
  <div className="flex items-center gap-2">
    {avgComparison >= -5 && avgComparison <= 10 ? (
      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
        Priced in line with recent sales
      </Badge>
    ) : avgComparison > 10 && avgComparison <= 20 ? (
      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/15">
        Above average for this area (+{avgComparison.toFixed(0)}%)
      </Badge>
    ) : avgComparison > 20 ? (
      <Badge className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15">
        Significantly above market (+{avgComparison.toFixed(0)}%)
      </Badge>
    ) : avgComparison < -5 ? (
      <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/15">
        Below average — potential value ({avgComparison.toFixed(0)}%)
      </Badge>
    ) : null}
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <p className="text-xs">
          Based on {comps.length} nearby sale{comps.length > 1 ? 's' : ''} comparing price/m².
        </p>
      </TooltipContent>
    </Tooltip>
  </div>
)}
```

**Key changes:**
- Removed the `p-3 rounded-lg bg-muted/50 border` wrapper → cleaner, no wasted space
- `emerald-500` → `primary` (blue) for favorable states
- `rose-500` → `destructive` for negative states
- Smaller info icon (`h-3.5` instead of `h-4`)
- Tooltip on the side instead of left for better flow

