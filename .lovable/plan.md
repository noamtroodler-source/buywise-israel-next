

# Fix Navigation Menu Hover Hitbox Issue

## Problem Identified
The mega-menu dropdowns require hovering "above" the trigger text to activate because there's a **6px gap** (`mt-1.5`) between the trigger and the dropdown content. When the mouse moves through this gap, it loses focus and the menu closes.

Additionally, each menu (Buy, Rent, Projects) creates its own isolated `NavigationMenu` instance with its own viewport, which prevents smooth transitions between menus.

---

## Root Cause Analysis

### Issue 1: Gap Between Trigger and Dropdown
In `src/components/ui/navigation-menu.tsx` line 83:
```typescript
"relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)]..."
```
The `mt-1.5` creates a 6px gap where hover is lost.

### Issue 2: Trigger Has Minimal Height
In `MegaMenu.tsx` line 27:
```typescript
className="bg-transparent px-0 py-0 h-auto..."
```
The trigger button has no padding, making the hover target very small.

### Issue 3: Separate NavigationMenu Instances
Each MegaMenu creates its own `<NavigationMenu>` root. This isolates each menu, preventing Radix's built-in hover-bridging behavior that normally works when multiple items share a single root.

---

## Solution

### Step 1: Increase Trigger Hitbox
Add vertical padding to the trigger so users have a larger hover target and the trigger extends closer to where the dropdown appears.

**File**: `src/components/layout/MegaMenu.tsx`
```typescript
// Change trigger className from:
className="bg-transparent px-0 py-0 h-auto text-base..."

// To:
className="bg-transparent px-2 py-2 h-auto text-base..."
```

### Step 2: Eliminate the Viewport Gap
Remove the `mt-1.5` that creates the dead zone.

**File**: `src/components/ui/navigation-menu.tsx`
```typescript
// Change viewport className from:
"relative mt-1.5 h-[var(--radix-navigation-menu-viewport-height)]..."

// To:
"relative mt-0 h-[var(--radix-navigation-menu-viewport-height)]..."
```

### Step 3: Add Invisible Hover Bridge (Fallback)
Add an invisible pseudo-element that extends the trigger's hover area downward to bridge any remaining gap.

**File**: `src/components/layout/MegaMenu.tsx`
```typescript
// Add after:before pseudo-element to NavigationMenuItem
<NavigationMenuItem className="relative after:content-[''] after:absolute after:left-0 after:right-0 after:top-full after:h-4 after:bg-transparent">
```

### Step 4: Apply Same Fixes to MoreNav
Apply consistent fixes to the "More" dropdown.

**File**: `src/components/layout/MoreNav.tsx`
- Add padding to trigger
- Add hover bridge pseudo-element

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ui/navigation-menu.tsx` | Remove `mt-1.5` gap from viewport |
| `src/components/layout/MegaMenu.tsx` | Add trigger padding + hover bridge |
| `src/components/layout/MoreNav.tsx` | Add trigger padding + hover bridge |

---

## Expected Result
- Users can hover directly on "Buy", "Rent", "Projects", and "More" text
- Smooth transition from trigger to dropdown without losing focus
- Works consistently on preview, live site, and all browsers
- No visible visual change (bridge is invisible)

