

# Fix Financing Method Toggle to Show the Action, Not Current State

## Problem

In the Financing Method section on the profile page, when the user's current preference is "Paid in Full" (cash), the toggle displays:
- **Label**: "Paying in Full"  
- **Subtitle**: "Cash purchase"  
- **Toggle**: OFF

This is confusing because the toggle label describes the **current state**, not what happens when you toggle it. The user expects the toggle to show what you're switching **to** when you turn it on.

## Current Behavior (Lines 79-84)
```tsx
<p className="text-sm font-medium">
  {formData.includeMortgage ? 'Taking a Mortgage' : 'Paying in Full'}
</p>
<p className="text-xs text-muted-foreground">
  {formData.includeMortgage ? 'Financing part of the purchase' : 'Cash purchase'}
</p>
```

When `includeMortgage = false` (Paid in Full):
- Shows: "Paying in Full / Cash purchase" with toggle OFF
- Problem: Turning the toggle ON doesn't mean "Paying in Full" - it means the opposite!

## Expected Behavior

The toggle should describe **what happens when you turn it ON**:

| Current State | Toggle Label | Toggle Subtitle | Toggle State |
|---------------|--------------|-----------------|--------------|
| Paid in Full | Take a Mortgage | Finance part of the purchase | OFF → turn ON to enable mortgage |
| Taking Mortgage | Pay in Full | Cash purchase | ON → turn OFF to go back to cash |

This is a common UX pattern where the toggle label describes the action you're opting into.

## The Fix

### File: `src/components/profile/sections/MortgageSection.tsx`

Change lines 78-85 to use a **fixed label approach** that describes the action:

**Before:**
```tsx
<div>
  <p className="text-sm font-medium">
    {formData.includeMortgage ? 'Taking a Mortgage' : 'Paying in Full'}
  </p>
  <p className="text-xs text-muted-foreground">
    {formData.includeMortgage ? 'Financing part of the purchase' : 'Cash purchase'}
  </p>
</div>
```

**After:**
```tsx
<div>
  <p className="text-sm font-medium">Take a Mortgage</p>
  <p className="text-xs text-muted-foreground">
    {formData.includeMortgage 
      ? 'Currently financing part of the purchase' 
      : 'Toggle on to include mortgage costs'}
  </p>
</div>
```

This approach:
1. Uses a **fixed label** "Take a Mortgage" - the toggle is for opting INTO a mortgage
2. The **subtitle dynamically explains** the current state or what toggling will do
3. When OFF: "Toggle on to include mortgage costs"
4. When ON: "Currently financing part of the purchase"

### Icon Change (Lines 73-77)

Also update the icon to always show the mortgage/credit card icon since that's what the toggle controls:

**Before:**
```tsx
{formData.includeMortgage ? (
  <CreditCard className="h-4 w-4 text-primary" />
) : (
  <Banknote className="h-4 w-4 text-primary" />
)}
```

**After:**
```tsx
<CreditCard className="h-4 w-4 text-primary" />
```

## Summary

| File | Lines | Change |
|------|-------|--------|
| `src/components/profile/sections/MortgageSection.tsx` | 73-77 | Use fixed CreditCard icon |
| `src/components/profile/sections/MortgageSection.tsx` | 78-85 | Fixed "Take a Mortgage" label with dynamic subtitle |

## Result After Fix

When user is "Paid in Full" (cash):
- Label: "Take a Mortgage"
- Subtitle: "Toggle on to include mortgage costs"
- Toggle: OFF

When user is "Taking a Mortgage":
- Label: "Take a Mortgage" 
- Subtitle: "Currently financing part of the purchase"
- Toggle: ON

This follows standard toggle UX where the label describes what you're opting into, and the ON/OFF state indicates whether that option is active.

