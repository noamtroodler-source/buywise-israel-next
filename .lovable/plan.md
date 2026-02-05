
# Fix: Change Share Dropdown Hover Color to Blue

## Problem
The dropdown menu items in ShareButton use `focus:bg-accent` which maps to yellow in the current theme. Per the platform's color palette standards, selection and hover states should use blue (primary color).

## Solution
Update the `DropdownMenuItem` component to use `focus:bg-primary/10 focus:text-primary` instead of `focus:bg-accent focus:text-accent-foreground`. This aligns with the existing standard noted in the memory for SelectItem focus states.

---

## File to Update

### `src/components/ui/dropdown-menu.tsx` (line 82)

**Before:**
```typescript
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
```

**After:**
```typescript
"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-primary/10 focus:text-primary"
```

---

## Impact
This change applies globally to all dropdown menus across the app, ensuring consistent blue hover states that match the brand color palette (matching the fix already applied to SelectItem per the UI component standards).

| Component | Before | After |
|-----------|--------|-------|
| ShareButton dropdown | Yellow hover | Blue hover |
| ProjectShareButton | Yellow hover | Blue hover |
| All other dropdowns | Yellow hover | Blue hover |

---

## Summary

| File | Change |
|------|--------|
| `src/components/ui/dropdown-menu.tsx` | `focus:bg-accent focus:text-accent-foreground` → `focus:bg-primary/10 focus:text-primary` |

**Effort:** 1 minute
