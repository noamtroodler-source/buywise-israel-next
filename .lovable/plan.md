

# Restore Clear "Paid in Full" / "Mortgage" Choice UI

## What You Want

You want both financing options to be clearly visible:
- If you're on **Paid in Full** → see that clearly, with option to switch to Mortgage
- If you're on **Mortgage** → see that with the mortgage details, with option to switch back to Paid in Full

The toggle should make logical sense - showing what you're switching TO, not just a generic "Take a Mortgage" label.

## The Fix

### File: `src/components/profile/sections/MortgageSection.tsx`

**When NOT editing (view mode):**

Replace the current toggle-only approach (lines 140-158) with a clear two-state display:

**If Paid in Full:**
```
┌─────────────────────────────────────────────┐
│ 💵 Paid in Full                             │
│    Cash purchase - no mortgage costs        │
│                                             │
│    [ Switch to Mortgage ]  ← subtle button  │
└─────────────────────────────────────────────┘
```

**If Mortgage:**
```
┌─────────────────────────────────────────────────┐
│ 💳 Taking a Mortgage                            │
│    Down Payment: 25% | Term: 25 years | etc.   │
│                                                 │
│    [ Switch to Paid in Full ]  ← subtle button │
└─────────────────────────────────────────────────┘
```

### Code Changes

**Lines 140-158** - Replace with clear state display:

```tsx
{!includeMortgage ? (
  // Paid in Full state
  <div className="p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-2 mb-2">
      <Banknote className="h-4 w-4 text-primary" />
      <p className="text-sm font-medium">Paid in Full</p>
    </div>
    <p className="text-xs text-muted-foreground mb-3">
      Cash purchase — cost breakdowns exclude mortgage fees
    </p>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => savePreferences({ include_mortgage: true })}
      disabled={isSaving}
      className="text-xs h-7"
    >
      <CreditCard className="h-3 w-3 mr-1" />
      Switch to Mortgage
    </Button>
  </div>
) : (
```

**After the mortgage details grid (around line 193)** - Add switch-back button:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={() => savePreferences({ include_mortgage: false })}
  disabled={isSaving}
  className="text-xs h-7"
>
  <Banknote className="h-3 w-3 mr-1" />
  Switch to Paid in Full
</Button>
```

## Summary

| State | What User Sees | Action Available |
|-------|----------------|------------------|
| Paid in Full | Clear "Paid in Full" label with description | "Switch to Mortgage" button |
| Mortgage | Mortgage details (down payment, term, etc.) | "Switch to Paid in Full" button |

Both options are always accessible, and the current state is clearly displayed.

