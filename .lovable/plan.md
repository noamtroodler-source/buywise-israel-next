

# Make "More" Dropdown Open on Hover

## Overview

Change the "More" navigation dropdown in the site header to open when the user hovers over it, rather than requiring a click. This provides a smoother navigation experience similar to traditional website mega-menus.

## Current Behavior

The "More" dropdown uses Radix's `DropdownMenu` component with default behavior (click to open/close).

## Solution

Convert the dropdown to a controlled component with state that responds to mouse enter/leave events:

1. Add state to track whether the "More" dropdown is open
2. Add `onMouseEnter` to open the dropdown when hovering over the trigger
3. Add `onMouseLeave` to close the dropdown when the mouse leaves both the trigger and content
4. Use the `open` and `onOpenChange` props on `DropdownMenu` for controlled behavior

## Technical Changes

**File:** `src/components/layout/Header.tsx`

1. Add new state variable:
   ```tsx
   const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
   ```

2. Wrap the dropdown in a container div with hover handlers:
   ```tsx
   <div 
     onMouseEnter={() => setMoreDropdownOpen(true)} 
     onMouseLeave={() => setMoreDropdownOpen(false)}
   >
     <DropdownMenu open={moreDropdownOpen} onOpenChange={setMoreDropdownOpen}>
       ...
     </DropdownMenu>
   </div>
   ```

3. The dropdown will now:
   - Open when mouse enters the "More" button
   - Stay open when mouse moves to the dropdown content
   - Close when mouse leaves the entire area
   - Still work with click/keyboard for accessibility

## Files Modified

1. `src/components/layout/Header.tsx` - Add hover behavior to "More" dropdown

