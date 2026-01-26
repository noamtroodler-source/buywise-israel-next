

# Remove Yellow "Paid in Full" Box and Show Toggle Instead

## Problem

When the user is in "Paid in Full" mode (not editing), they see a yellow box with "Paid in Full" text. The user wants to remove this yellow box and instead show the same toggle interface that appears in the editing mode.

## Current Behavior (Lines 140-149)

When not editing and `includeMortgage = false`:
```tsx
<div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
  <div className="flex items-center gap-2">
    <Banknote className="h-4 w-4 text-accent-foreground" />
    <p className="text-sm font-medium text-accent-foreground">Paid in Full</p>
  </div>
  <p className="text-xs text-muted-foreground mt-1">
    Cost breakdowns will exclude mortgage-related fees
  </p>
</div>
```

This creates the yellow/accent-colored box the user wants removed.

## The Fix

Replace the yellow "Paid in Full" box with the same toggle interface used in the editing mode. This provides a consistent experience and lets users quickly toggle their financing method.

### File: `src/components/profile/sections/MortgageSection.tsx`

**Lines 140-149** - Replace the yellow box with the toggle interface:

```tsx
{!includeMortgage ? (
  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-2">
      <CreditCard className="h-4 w-4 text-primary" />
      <div>
        <p className="text-sm font-medium">Take a Mortgage</p>
        <p className="text-xs text-muted-foreground">
          Toggle on to include mortgage costs
        </p>
      </div>
    </div>
    <Switch
      checked={includeMortgage}
      onCheckedChange={(checked) => {
        savePreferences({ include_mortgage: checked });
      }}
      disabled={isSaving}
    />
  </div>
) : (
```

## Changes Summary

| Location | Before | After |
|----------|--------|-------|
| Lines 140-149 | Yellow `bg-accent/10` box with "Paid in Full" | Gray `bg-muted/50` toggle with "Take a Mortgage" label and Switch |

## Result

- No more yellow box when in "Paid in Full" mode
- Users see a clean toggle interface matching the second screenshot
- Toggling directly saves the preference (no need to click Edit first)
- Consistent visual style with the editing mode

