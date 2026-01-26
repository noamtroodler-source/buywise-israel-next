

# Fix AI Snapshot Card Visual Consistency

## Problem
The "vs Market Rate" card in AI Rental Snapshot appears faded/lighter than the other two cards because of conditional color logic. When the percentage is positive (above market rate), both the icon and the main percentage value use `text-muted-foreground` instead of `text-foreground`, making the entire card look washed out.

The same issue exists in the "12-Month Trend" card for purchase properties where negative trends appear muted.

## Solution
Standardize all snapshot cards to use consistent `text-foreground` for the main value text, ensuring visual uniformity across all cards. Icons will remain neutral (no conditional coloring).

## File to Modify
**`src/components/property/PropertyValueSnapshot.tsx`**

### Change 1: Fix Rental "vs Market Rate" Card (Lines 143-158)

**Current:**
- Icon: Conditionally `text-muted-foreground` or `text-primary`
- Value: Conditionally `text-muted-foreground`, `text-primary`, or `text-foreground`

**New:**
- Icon: Remove conditional coloring (use default from parent `text-muted-foreground`)
- Value: Always use `text-foreground`

### Change 2: Fix Purchase "12-Month Trend" Card (Lines 239-254)

**Current:**
- Icon: Conditionally `text-primary` or `text-muted-foreground`
- Value: Conditionally `text-primary`, `text-muted-foreground`, or `text-foreground`

**New:**
- Icon: Remove conditional coloring (use default)
- Value: Always use `text-foreground`

## Visual Result

All cards will now have:
- Same background: `bg-muted/30 border border-border/50`
- Same header styling: `text-muted-foreground`
- Same value styling: `text-2xl font-bold text-foreground`
- Same helper text: `text-xs text-muted-foreground`

```text
Before:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Monthly│  │ City Avg     │  │ vs Market    │
│ ₪19,403/mo  │  │ ₪8,000/mo   │  │ +143%        │ ← faded gray
│ (bold black) │  │ (bold black) │  │ (light gray) │
└──────────────┘  └──────────────┘  └──────────────┘

After:
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Total Monthly│  │ City Avg     │  │ vs Market    │
│ ₪19,403/mo  │  │ ₪8,000/mo   │  │ +143%        │ ← consistent
│ (bold black) │  │ (bold black) │  │ (bold black) │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Technical Details

The specific lines to update:

1. **Lines 143-149**: Remove conditional icon coloring for rental comparison
2. **Lines 152-158**: Change to always use `text-foreground`
3. **Lines 239-245**: Remove conditional icon coloring for price trend
4. **Lines 248-254**: Change to always use `text-foreground`

