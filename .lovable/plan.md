
# Standardize Favorite and Share Button Styling

## Problem
The favorite (heart) and share buttons have inconsistent styling across different parts of the app:

1. **Property FavoriteButton**: Uses Button's default `icon` size (h-10 w-10), no explicit size or rounded style
2. **Property ShareButton**: Uses `h-8 w-8` with `rounded-full` (circular)
3. **Project FavoriteButton**: Uses `h-8 w-8` with existing background
4. **Project ShareButton**: Uses `h-8 w-8`

The user wants the "box" style visible on rental cards (rounded rectangle, not circle) applied consistently everywhere.

## Solution
Standardize all 4 button components to use:
- **Size**: `h-8 w-8` 
- **Border radius**: `rounded-md` (soft rectangle like the screenshot)
- **Background**: `bg-background/80 hover:bg-background`
- **Transition**: `transition-colors`

## Files to Modify

### 1. `src/components/property/FavoriteButton.tsx`
Update the Button className to use explicit sizing and rounded style:

```tsx
<Button
  variant="ghost"
  size="icon"
  className={cn(
    "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors",
    favorited ? "text-primary" : "text-muted-foreground hover:text-primary",
    className
  )}
  onClick={handleClick}
  disabled={isToggling}
>
```

### 2. `src/components/property/ShareButton.tsx`
Change from `rounded-full` to `rounded-md` and ensure consistent sizing:

```tsx
<Button
  variant="ghost"
  size="icon"
  onPointerDown={(e) => e.stopPropagation()}
  onClick={(e) => e.stopPropagation()}
  className={cn(
    "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors",
    className
  )}
>
```

Also simplify the size prop handling since we want consistent sizing everywhere.

### 3. `src/components/project/ProjectFavoriteButton.tsx`
Add `rounded-md` to className (already has correct sizing):

```tsx
className={cn(
  "h-8 w-8 rounded-md bg-background/80 hover:bg-background transition-colors",
  isFavorite 
    ? "text-primary hover:text-primary/80" 
    : "text-muted-foreground hover:text-primary",
  className
)}
```

Also change the favorited color from `text-destructive` (red) to `text-primary` (blue) to match brand color standards.

### 4. `src/components/project/ProjectShareButton.tsx`
Add `rounded-md` to className:

```tsx
className={cn(
  "h-8 w-8 rounded-md bg-background/80 hover:bg-background text-muted-foreground hover:text-foreground transition-colors",
  className
)}
```

## Remove Override Classes in Parent Components
After updating the base components, we can remove redundant className overrides in:

### 5. `src/components/home/ProjectsHighlight.tsx`
Remove the `className="h-8 w-8 rounded-md bg-background/80 hover:bg-background"` override since it will now be the default.

### 6. `src/components/home/ProjectCarousel.tsx`
Same cleanup - remove redundant className overrides.

### 7. `src/pages/Projects.tsx`
No changes needed - base component styling will apply.

### 8. `src/components/property/PropertyCard.tsx`
No changes needed - PropertyCard already uses FavoriteButton and ShareButton which will now have consistent styling.

## Visual Result

**Before (inconsistent):**
- Some buttons are circles (`rounded-full`)
- Different sizes (h-10 vs h-8)
- FavoriteButton for projects uses red when favorited

**After (consistent):**
```text
┌─────────┐  ┌─────────┐
│    ♡    │  │   ↗     │
└─────────┘  └─────────┘
   8x8px       8x8px
 rounded-md  rounded-md
```

All buttons will have the same soft rectangular "box" appearance matching the screenshot from the rental page.

## Color Standardization
Per project memory on brand colors:
- Favorited state: `text-primary` (blue) with `fill-current`
- Unfavorited: `text-muted-foreground` with `hover:text-primary`
- This applies to BOTH property and project favorites (removing the red `text-destructive` from projects)
