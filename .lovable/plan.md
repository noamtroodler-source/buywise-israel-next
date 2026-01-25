

# Add "First-Time Buyer" Label with Cost Benefit Context

## Problem

Currently, the PersonalizationHeader shows `shortLabel` ("First-Time") for guests instead of the full label ("First-Time Buyer"). Users need to understand:
1. What category they're being estimated as (First-Time **Buyer**)
2. How this affects their costs (e.g., "Zero tax on first ₪1.98M")

## Solution

1. **Change label from "First-Time" to "First-Time Buyer"** - Use the full `label` instead of `shortLabel` for guest display
2. **Add benefit context** - Show a brief explanation of what first-time buyer rates mean for costs

## Current State

**Line 173** in `PersonalizationHeader.tsx`:
```typescript
const displayLabel = user ? buyerCategoryLabel : derived.shortLabel;
```

This shows:
- `shortLabel` = "First-Time" for guests
- `buyerCategoryLabel` for logged-in users

## Changes Required

### File: `src/components/property/PersonalizationHeader.tsx`

**Change 1**: Use `derived.label` instead of `derived.shortLabel` for guests

```typescript
// Line 173 - Change from:
const displayLabel = user ? buyerCategoryLabel : derived.shortLabel;

// To:
const displayLabel = user ? buyerCategoryLabel : derived.label;
```

**Change 2**: Add benefit context below the buyer type (for guests only)

Update the guest header content (lines 200-230) to include a brief benefit summary:

```tsx
<div className="flex items-start gap-2 p-2.5 rounded-lg bg-muted/50 border border-border/50">
  <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2 flex-wrap text-sm">
      <span className="text-muted-foreground">
        Showing estimates for:{' '}
        <span className="font-medium text-foreground">{displayLabel}</span>
        <span className="mx-1.5 text-muted-foreground/40">·</span>
        <span className="font-medium text-foreground">{financingLabel}</span>
      </span>
    </div>
    
    {/* NEW: Show benefit context for first-time buyers */}
    {derived.taxType === 'first_time' && (
      <p className="text-xs text-muted-foreground mt-1">
        Zero purchase tax up to ₪1.98M · Lower rates above
      </p>
    )}
    
    <p className="text-xs text-muted-foreground mt-1">
      Your situation different?{' '}
      {/* ... existing CTA links ... */}
    </p>
  </div>
</div>
```

### File: `src/components/shared/GuestAssumptionsBanner.tsx`

For consistency, also update this component to show benefit context:

1. Add `benefitSummary` prop or derive it from `buyerTypeLabel`
2. Show brief benefit explanation below the assumptions line

## Expected Result

**Before:**
```
Showing estimates for: First-Time · Paid in Full
Your situation different? Set up profile (free) · Adjust assumptions
```

**After:**
```
Showing estimates for: First-Time Buyer · Paid in Full
Zero purchase tax up to ₪1.98M · Lower rates above
Your situation different? Set up profile (free) · Adjust assumptions
```

## Files to Modify

| File | Change |
|------|--------|
| `src/components/property/PersonalizationHeader.tsx` | Change `shortLabel` to `label`, add benefit context |
| `src/components/shared/GuestAssumptionsBanner.tsx` | Add optional benefit context prop |

