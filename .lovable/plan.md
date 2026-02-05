
# Fix Tooltip Behavior for Rooms & Bathrooms Filter

## Problem
The tooltip for the "Rooms" help icon on the buy/rent listings pages opens unexpectedly and behaves glitchy. Users report it opens without intentional hover.

## Root Cause
In `PropertyFilters.tsx`:
1. The parent `TooltipProvider` (line 315) has no `delayDuration` set, causing instant/shared tooltip timing
2. The `TooltipTrigger` wraps the icon directly instead of using `asChild` pattern
3. No `skipDelayDuration` specified, meaning hovering between tooltips can trigger instant open/close

## Solution

### Changes to `src/components/filters/PropertyFilters.tsx`

**1. Add delay to TooltipProvider** (line 315)
Change:
```tsx
<TooltipProvider>
```
To:
```tsx
<TooltipProvider delayDuration={400} skipDelayDuration={100}>
```
This ensures:
- 400ms delay before tooltip opens (prevents accidental triggers)
- 100ms skip delay when moving between tooltips (prevents rapid flickering)

**2. Fix TooltipTrigger pattern** (lines 603-606)
Change:
```tsx
<Tooltip>
  <TooltipTrigger>
    <HelpCircle className="h-4 w-4 text-muted-foreground" />
  </TooltipTrigger>
```
To:
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <button type="button" className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
    </button>
  </TooltipTrigger>
```
This:
- Uses `asChild` for proper event handling
- Wraps in a button for accessibility
- Adds `type="button"` to prevent form submission
- Adds focus ring for accessibility
- Adds `cursor-help` for better UX

**3. Add animation stability** to TooltipContent
The existing animate classes may cause visual glitching. Ensure smooth animation by keeping default Radix animations but verifying they complete properly.

## Technical Details

| Change | Location | Purpose |
|--------|----------|---------|
| `delayDuration={400}` | Line 315 | Requires deliberate hover, not accidental |
| `skipDelayDuration={100}` | Line 315 | Prevents flicker when moving between tooltips |
| `asChild` on TooltipTrigger | Lines 604-606 | Proper event propagation and accessibility |
| Button wrapper | Lines 604-606 | Semantic element for keyboard accessibility |

## Files to Modify
- `src/components/filters/PropertyFilters.tsx` - 2 small edits (~10 lines changed)

## Result
- Tooltip only appears after deliberate 400ms hover
- No automatic opening on page load or focus
- Smooth animation without flickering
- Proper keyboard accessibility maintained
