
# Fix Blue Focus Ring on Select Component

## Problem
The Select dropdown shows a persistent blue focus ring after making a selection with the mouse. This ring stays visible until clicking somewhere else on the page, which is visually distracting.

## Root Cause
The `SelectTrigger` component in `src/components/ui/select.tsx` uses `focus:ring-2` styles which apply whenever the element is focused (including after mouse clicks). The better approach is `focus-visible:ring-2` which only shows the ring during keyboard navigation.

## Solution
Update the `SelectTrigger` component to use `focus-visible` instead of `focus` for the ring styles.

## File to Modify
`src/components/ui/select.tsx` (line 20)

### Current Code:
```tsx
"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
```

### Updated Code:
```tsx
"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
```

## What Changes
- `focus:outline-none` → `focus-visible:outline-none`
- `focus:ring-2` → `focus-visible:ring-2`
- `focus:ring-ring` → `focus-visible:ring-ring`
- `focus:ring-offset-2` → `focus-visible:ring-offset-2`

## Result
- **Mouse clicks**: No blue ring after selecting an option
- **Keyboard navigation**: Ring still appears for accessibility (Tab key navigation)

This matches the behavior already used on the Button component and is the modern best practice for focus indicators.
