
# Dual Currency/Unit Preferences Button

## Summary

Replace the current hidden gear icon with a polished, branded button that displays both the active currency and unit preferences (e.g., `₪ · m²` or `$ · ft²`). This makes the preferences feature immediately visible and self-descriptive, encouraging users to click and customize their experience.

---

## Design Approach

### Button Appearance

```text
┌─────────────────┐
│  ₪ · m²    ▾   │   ← Current state displayed
└─────────────────┘
```

**Styling Details:**
- **Shape**: Rounded pill/capsule (`rounded-full`)
- **Size**: Height matches other header elements (`h-9`), padding adjusted for content (`px-3`)
- **Border**: Subtle border for definition (`border border-border/60`)
- **Typography**: Medium weight, small text (`text-sm font-medium`)
- **Icon**: Small chevron to indicate dropdown (`ChevronDown h-3 w-3`)
- **Hover State**: Light primary tint (`hover:bg-primary/5 hover:border-primary/30`)
- **Active Indicator**: Subtle dot separator (`·`) between currency and unit

### Dynamic Content Mapping

| Preference | Display Symbol |
|------------|----------------|
| ILS currency | `₪` |
| USD currency | `$` |
| sqm unit | `m²` |
| sqft unit | `ft²` |

---

## Implementation Changes

### 1. Update PreferencesDialog Component

**File:** `src/components/layout/PreferencesDialog.tsx`

Modify the default trigger button to display the current preferences:

```tsx
// Add usePreferences context and ChevronDown icon
import { ChevronDown } from 'lucide-react';

// In the component, derive display values
const currencySymbol = currency === 'USD' ? '$' : '₪';
const unitLabel = areaUnit === 'sqft' ? 'ft²' : 'm²';

// Replace the default trigger
{trigger || (
  <Button 
    variant="ghost" 
    className="h-9 px-3 gap-1.5 rounded-full border border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all"
  >
    <span className="text-sm font-medium text-foreground">
      {currencySymbol} · {unitLabel}
    </span>
    <ChevronDown className="h-3 w-3 text-muted-foreground" />
  </Button>
)}
```

### 2. Update Mobile Menu Trigger

**File:** `src/components/layout/Header.tsx`

Update the mobile menu preferences trigger to also show the active state:

```tsx
// Lines 412-419: Update mobile preferences button
<PreferencesDialog 
  trigger={
    <button className="flex items-center justify-between px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-md w-full">
      <span className="flex items-center gap-2">
        <Settings className="h-4 w-4" />
        Preferences
      </span>
      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
        {currencySymbol} · {unitLabel}
      </span>
    </button>
  }
/>
```

This requires importing `usePreferences` in the Header component to access the current values.

---

## Visual Integration

### Consistency with BuyWise Branding

- Uses the established primary blue color for hover states (`hover:bg-primary/5`)
- Matches the `h-9` height of other header buttons (favorites, user menu)
- Rounded pill shape complements the logo and navigation style
- Neutral border with subtle hover accent follows the card hover pattern

### Desktop Layout (Right Side)

```text
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Buy  Rent  Projects  ...  │  [₪ · m²ˇ] [♡] [👤]  │
└─────────────────────────────────────────────────────────────┘
```

The new button sits in the same position as the old gear icon but is now visually prominent and descriptive.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/layout/PreferencesDialog.tsx` | Update default trigger to show currency/unit display with chevron |
| `src/components/layout/Header.tsx` | Import `usePreferences`, update mobile trigger to show active state |

---

## Expected Result

**Before:** Users see a generic gear icon with no indication of what it does
**After:** Users see their active currency and unit (e.g., `₪ · m²`) making it immediately clear this controls display preferences, increasing discoverability and clicks

---

## Technical Notes

- No new components needed - just modifying existing trigger styling
- Uses existing `usePreferences` hook from `PreferencesContext`
- Maintains full dropdown functionality when clicked
- Changes persist via existing localStorage mechanism
