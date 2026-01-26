
# Fix Focus Ring on Preferences Button

## Problem

The new preferences button (`₪ · m²`) retains a blue focus ring after clicking away from the dropdown. This happens because the `Button` component has default focus-visible ring styling, and the button stays focused after the dropdown closes.

---

## Solution

Add focus ring override classes to the Button component to remove the persistent ring effect.

---

## Change Required

**File:** `src/components/layout/PreferencesDialog.tsx` (line 78)

Add `focus-visible:ring-0 focus-visible:ring-offset-0` to the button's className:

```tsx
<Button 
  variant="ghost" 
  className="h-9 px-3 gap-1.5 rounded-full border border-border/60 hover:bg-primary/5 hover:border-primary/30 transition-all focus-visible:ring-0 focus-visible:ring-offset-0"
>
```

---

## Why This Works

The `Button` component in `src/components/ui/button.tsx` has these default focus styles:
```
focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
```

By adding `focus-visible:ring-0 focus-visible:ring-offset-0`, we override these defaults and remove the blue ring that appears after interaction.

---

## Result

After clicking the preferences dropdown and clicking away, the button will return to its normal state without any lingering focus ring, matching the expected behavior of other header elements.
