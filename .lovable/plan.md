
# RecentNearbySales Design Enhancement Plan

## Overview

Enhance the "Recent Nearby Sales" component to match the design quality, educational approach, and visual standards established across the BuyWise Israel platform. The current implementation is functional but lacks the tooltips, educational context, and refined styling patterns used in PropertyValueSnapshot, PropertyCostBreakdown, and PropertyQuickSummary.

---

## Design Patterns to Apply

Based on analysis of the existing codebase:

### 1. Educational Tooltips (GlossaryTooltip Pattern)
- **Current approach**: Small text below for context ("Data source: Israel Tax Authority...")
- **Target approach**: Dotted-underline triggers with TooltipProvider + Tooltip for inline education
- **Example from site**: PropertyCostBreakdown uses `border-b border-dotted border-muted-foreground/50` with `cursor-help` for explanation triggers

### 2. Section Header Pattern
- **Current approach**: Icon + title left, small metadata right
- **Target approach**: Match PropertyValueSnapshot/PropertyCostBreakdown with consistent icon sizing and BarChart3-style header treatment

### 3. Card Layout Pattern
- **Current approach**: Basic border cards with icon + text
- **Target approach**: Match PropertyQuickSummary's "Quick Facts" grid style with `bg-muted/50 rounded-lg p-3` containers

### 4. Badge Styling
- **Current approach**: Uses `variant="destructive"` for above-market comparison
- **Target approach**: Per brand guidelines, replace red/destructive with brand-blue variants (`bg-primary/10 text-primary`)

### 5. Price Formatting
- **Current approach**: Uses local formatPrice function
- **Target approach**: Use `useFormatPrice` hook from PreferencesContext for user currency preferences

---

## Implementation Details

### 3.1 Add TooltipProvider Wrapper

Wrap entire component in TooltipProvider for consistent tooltip behavior:

```tsx
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

return (
  <TooltipProvider>
    <div className="space-y-4">
      {/* Component content */}
    </div>
  </TooltipProvider>
);
```

### 3.2 Section Header with Educational Tooltip

Add tooltip explaining what "Recent Nearby Sales" means and why it's valuable:

```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <TrendingUp className="h-5 w-5 text-primary" />
    <Tooltip>
      <TooltipTrigger asChild>
        <h3 className="text-lg font-semibold text-foreground cursor-help border-b border-dotted border-muted-foreground/30">
          Recent Nearby Sales
        </h3>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-sm">
        <p className="font-medium mb-1">Government Transaction Data</p>
        <p className="text-xs text-muted-foreground">
          Official sold prices from Israel Tax Authority & Nadlan.gov.il. 
          These are actual recorded transactions—not listing prices.
        </p>
      </TooltipContent>
    </Tooltip>
  </div>
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="text-xs text-muted-foreground cursor-help border-b border-dotted border-muted-foreground/30">
        Last 24 months • Within 500m
      </span>
    </TooltipTrigger>
    <TooltipContent side="left" className="max-w-xs">
      <p className="text-xs">Shows properties sold within 500 meters of this listing in the past 24 months. Closer matches appear first.</p>
    </TooltipContent>
  </Tooltip>
</div>
```

### 3.3 Comp Card Redesign

Match PropertyQuickSummary's Quick Facts grid styling:

Current card styling:
```tsx
className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/30"
```

New styling (matching Quick Facts):
```tsx
className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors"
```

### 3.4 Educational Tooltips for Comp Details

Add tooltips to explain each data point:

**Distance Tooltip:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="flex items-center gap-1 cursor-help">
      <MapPin className="h-3 w-3" />
      {comp.is_same_building ? (
        <Badge variant="secondary" className="text-xs px-1.5 py-0">
          Same building
        </Badge>
      ) : (
        <span className="border-b border-dotted border-muted-foreground/50">
          {formatDistance(comp.distance_meters)}
        </span>
      )}
    </span>
  </TooltipTrigger>
  <TooltipContent side="top" className="max-w-xs">
    <p className="font-medium mb-1">{comp.is_same_building ? 'Same Building' : 'Nearby Sale'}</p>
    <p className="text-xs text-muted-foreground">
      {comp.is_same_building 
        ? 'This sale occurred in the same building. Most relevant for direct price comparison.'
        : `This property sold ${Math.round(comp.distance_meters)} meters from this listing. Similar location factors should apply.`
      }
    </p>
  </TooltipContent>
</Tooltip>
```

**Price per sqm Tooltip:**
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <span className="flex items-center gap-1 cursor-help border-b border-dotted border-muted-foreground/50">
      <BarChart3 className="h-3 w-3" />
      {formatPrice(comp.price_per_sqm)}/m²
    </span>
  </TooltipTrigger>
  <TooltipContent side="top" className="max-w-xs">
    <p className="font-medium mb-1">Price per Square Meter</p>
    <p className="text-xs text-muted-foreground">
      The actual sold price divided by property size. Use this to compare value across different-sized properties.
    </p>
  </TooltipContent>
</Tooltip>
```

### 3.5 Comparison Badge Update

Replace destructive variant with brand-consistent styling:

Current:
```tsx
<Badge variant={comparison > 0 ? 'destructive' : 'default'}>
```

Updated (per color-palette-standards memory):
```tsx
<Badge 
  variant="secondary"
  className={cn(
    "text-xs",
    comparison > 0 ? "bg-primary/10 text-primary" : "bg-primary/10 text-primary"
  )}
>
```

Add tooltip explaining what the comparison means:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary cursor-help">
      {comparison > 0 
        ? `Listing is ${comparison.toFixed(0)}% above this sale`
        : `Listing is ${Math.abs(comparison).toFixed(0)}% below this sale`
      }
    </Badge>
  </TooltipTrigger>
  <TooltipContent side="top" className="max-w-xs">
    <p className="font-medium mb-1">Price per m² Comparison</p>
    <p className="text-xs text-muted-foreground">
      {comparison > 0 
        ? 'This listing\'s price per sqm is higher than what this nearby property sold for. Could indicate premium features or room for negotiation.'
        : 'This listing\'s price per sqm is below recent comparable sales—potentially good value or motivated seller.'
      }
    </p>
  </TooltipContent>
</Tooltip>
```

### 3.6 Use Global Currency Formatting

Replace local `formatPrice` with hook:

```tsx
import { useFormatPrice } from '@/contexts/PreferencesContext';

// Inside component
const formatPrice = useFormatPrice();

// Usage
{formatPrice(comp.sold_price, 'ILS')}
```

### 3.7 Empty State Enhancement

Add educational context to empty state:

```tsx
<div className="rounded-lg border border-border bg-muted/30 p-6 text-center">
  <Building2 className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
  <p className="text-sm font-medium text-foreground mb-1">
    No nearby sales data yet
  </p>
  <p className="text-xs text-muted-foreground">
    Government transaction data is added continuously. Check back later or explore the city's market overview.
  </p>
  <Button variant="outline" size="sm" className="mt-3" asChild>
    <Link to={`/areas/${citySlug}`}>
      View {city} Market Data
    </Link>
  </Button>
</div>
```

### 3.8 Source Attribution Footer Enhancement

Move data source to a more educational tooltip rather than small text:

```tsx
<div className="flex items-center justify-center gap-2 pt-3 border-t border-border/50">
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span className="border-b border-dotted border-muted-foreground/30">
          Government verified data
        </span>
      </div>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-xs">
      <p className="font-medium mb-1">Official Transaction Records</p>
      <p className="text-xs text-muted-foreground">
        Sourced from Israel Tax Authority and Nadlan.gov.il. 
        These are legally recorded sale prices—more reliable than listing or asking prices.
      </p>
    </TooltipContent>
  </Tooltip>
</div>
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/property/RecentNearbySales.tsx` | Complete redesign with tooltips, updated styling, global price formatting |

---

## Visual Comparison

### Before (Current)
```text
📍 Recent Nearby Sales                    Last 24 months • Within 500m
────────────────────────────────────────────────────────────────────────
┌ border card ──────────────────────────────────────────────────────────┐
│ 🏠 3BR, 92m² sold for ₪2,480,000                                     │
│    📍 Same building • 📅 Oct 2025 • 📈 ₪26,957/m²                    │
│    ⚠️ Listing is 8% above this sale  <-- red destructive badge       │
└───────────────────────────────────────────────────────────────────────┘

Data source: Israel Tax Authority & Nadlan.gov.il  <-- small footer text
```

### After (Enhanced)
```text
📈 Recent Nearby Sales (hover for explanation)    Last 24 months • 500m (hover)
   ─── dotted underline ───                       ─── dotted underline ───
────────────────────────────────────────────────────────────────────────
┌ bg-muted/50 card ─────────────────────────────────────────────────────┐
│ 🏠 3BR, 92m² sold for ₪2,480,000                                     │
│    📍 Same building (hover)  📅 Oct 2025  📊 ₪26,957/m² (hover)      │
│    🔵 Listing is 8% above this sale  <-- blue primary badge (hover)  │
└───────────────────────────────────────────────────────────────────────┘

────────────────────────────────────────────────────────────────────────
  🛡️ Government verified data (hover for source details)
```

---

## Testing Checklist

1. **Tooltip Functionality**
   - Hover on "Recent Nearby Sales" title shows explanation
   - Hover on "Last 24 months • Within 500m" shows criteria
   - Hover on "Same building" badge shows proximity details
   - Hover on price/m² shows calculation explanation
   - Hover on comparison badge explains meaning

2. **Visual Consistency**
   - Cards match Quick Facts grid styling (`bg-muted/50 rounded-lg`)
   - Badges use brand blue (`bg-primary/10 text-primary`) not red
   - Icons consistent with other sections (h-5 w-5 in headers)

3. **Mobile Responsiveness**
   - Tooltips work on touch (tap to reveal)
   - Cards stack properly on narrow screens
   - Text remains readable at all sizes

4. **Currency Preferences**
   - Prices respect user's currency preference setting
   - Format matches other price displays on property page

---

## Success Criteria

- All interactive elements have educational tooltips
- No red/destructive colors used (brand blue only)
- Visual styling matches PropertyQuickSummary and PropertyCostBreakdown
- Empty state includes actionable next step
- Data source is verified with ShieldCheck icon pattern
- User can understand the value of each data point through hover education
