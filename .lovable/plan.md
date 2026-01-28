

# Improve Navigation Menu Timing and Click Behavior

## Summary
Reduce the hover-out delay for a snappier feel, and ensure click-to-open/close works cleanly alongside the hover behavior.

---

## Changes Overview

### 1. Update NavigationMenu Component (`src/components/ui/navigation-menu.tsx`)

Add `delayDuration` and `skipDelayDuration` props to the NavigationMenu wrapper to allow customization, with faster defaults:

**Current:**
```tsx
const NavigationMenu = React.forwardRef<...>(({ className, children, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn("relative z-10...", className)}
    {...props}
  >
```

**Updated:**
```tsx
interface NavigationMenuProps extends React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root> {
  delayDuration?: number;
  skipDelayDuration?: number;
}

const NavigationMenu = React.forwardRef<...>(({ 
  className, 
  children, 
  delayDuration = 100,      // Faster open (was 200)
  skipDelayDuration = 150,  // Faster switch (was 300)
  ...props 
}, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    delayDuration={delayDuration}
    skipDelayDuration={skipDelayDuration}
    className={cn("relative z-10...", className)}
    {...props}
  >
```

---

### 2. Timing Values

| Setting | Default | New Value | Effect |
|---------|---------|-----------|--------|
| `delayDuration` | 200ms | 100ms | Menu opens faster after hover |
| `skipDelayDuration` | 150ms | 150ms | Quick switch between menu items |

The close behavior is affected by the exit delay, which we're reducing to make the menu feel more responsive when moving away.

---

### 3. Click Behavior

Radix Navigation Menu natively supports click-to-toggle. The trigger already handles:
- **Click to open** - opens the menu
- **Click again to close** - closes the menu
- **Click outside** - closes the menu

The current implementation should already work. If there are issues, we can verify by:
- Ensuring no `onPointerDown` or `onClick` handlers are interfering
- The trigger uses `data-state="open"` or `data-state="closed"` which toggles on click

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/ui/navigation-menu.tsx` | Add timing props with faster defaults (100ms/150ms) |

---

## Result
- Snappier hover response - menu closes faster when cursor leaves
- Click-to-toggle works cleanly alongside hover
- Consistent behavior across all mega-menus and the Company dropdown

