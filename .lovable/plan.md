

# Improve Financing Method Toggle Clarity

## Problem
The current toggle UI is confusing:
- It shows the current state ("Paid in Full") with an OFF toggle
- Users don't understand that turning the toggle ON will enable mortgage mode
- The label describes the current state, not what the action will do

## Solution
Redesign the toggle to clearly communicate:
1. **What it controls**: "Include Mortgage"
2. **Current state**: Visual feedback showing which mode is active
3. **What happens on click**: Clear indication that toggling adds/removes mortgage costs

## Design Change

**Current (confusing):**
```
┌───────────────────────────────────────────────────┐
│ 💵 Paid in Full                              [OFF] │
│    Cash purchase - no mortgage fees                │
└───────────────────────────────────────────────────┘
```

**Proposed (clear):**
```
┌───────────────────────────────────────────────────┐
│ 💳 Include Mortgage                          [OFF] │
│    Toggle ON to add mortgage costs & estimates     │
└───────────────────────────────────────────────────┘
```

When toggled ON:
```
┌───────────────────────────────────────────────────┐
│ 💳 Include Mortgage                           [ON] │
│    Mortgage costs & monthly payments included      │
└───────────────────────────────────────────────────┘
```

## Technical Details

**File**: `src/components/property/PersonalizationHeader.tsx`

Update lines 234-254 to change the toggle label and description:

**Before:**
- Label changes based on state ("Taking a Mortgage" / "Paid in Full")
- Description changes based on state
- Icon changes based on state

**After:**
- Label stays constant: "Include Mortgage"
- Description explains the toggle action when OFF, confirms active state when ON
- Icon stays as CreditCard (representing mortgage)

```tsx
<div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
  <div className="flex items-center gap-2">
    <CreditCard className="h-4 w-4 text-primary" />
    <div>
      <p className="text-sm font-medium">Include Mortgage</p>
      <p className="text-xs text-muted-foreground">
        {localIncludeMortgage 
          ? 'Mortgage costs & monthly payments included' 
          : 'Toggle on to add mortgage estimates'}
      </p>
    </div>
  </div>
  <Switch
    checked={localIncludeMortgage}
    onCheckedChange={setLocalIncludeMortgage}
  />
</div>
```

This makes it clear:
- The toggle controls **mortgage inclusion**
- OFF = no mortgage (cash/paid in full)
- ON = mortgage costs included
- Users understand what clicking will do

