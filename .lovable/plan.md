

## Rename "New Projects" to "Projects" and Change Yellow Hover to Blue

### Overview
Two simple changes are needed:
1. Rename the dropdown option from "New Projects" to just "Projects"
2. Change the yellow hover/focus color in the Select dropdown to use the blue primary color instead

### Changes

**File 1: `src/components/home/HeroSplit.tsx`**

Update line 112 to change the label:
- Before: `New Projects`
- After: `Projects`

**File 2: `src/components/ui/select.tsx`**

Update the `SelectItem` component (line 108) to use blue instead of yellow for the hover/focus state:
- Before: `focus:bg-accent focus:text-accent-foreground`
- After: `focus:bg-primary/10 focus:text-primary`

This follows the established color palette standards where primary blue (`bg-primary/10`, `text-primary`) is used for interactive states instead of the yellow accent.

### Technical Details
- The yellow color comes from the CSS variable `--accent: 45 100% 51%` (a golden yellow)
- The blue primary is `--primary: 213 94% 45%` 
- Using `bg-primary/10` gives a subtle blue tint background, and `text-primary` makes the text blue on focus/hover
- This change affects all Select dropdowns across the app, ensuring visual consistency

