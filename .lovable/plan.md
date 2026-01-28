
Goal
- Make the header “More” dropdown behave like Zillow: opens on hover, no “in-and-out” flicker when moving near the border/edge, and still works with keyboard/click.

What’s causing the glitch (root cause)
- The dropdown menu content is rendered in a Portal (outside the trigger’s DOM tree).
- Your current hover logic relies on mouse enter/leave events, but:
  1) There is a built-in gap between trigger and menu because `DropdownMenuContent` defaults to `sideOffset = 4` (in `src/components/ui/dropdown-menu.tsx`), creating a thin “dead zone”.
  2) When your cursor crosses that gap (or skims the menu border), the pointer briefly leaves both “trigger area” and “menu area”, which schedules a close. If you re-enter quickly, it cancels, producing a visible flicker.
- Zillow-style menus typically solve this with either:
  - No physical gap (0 offset / overlap), and/or
  - A small invisible “hover bridge” (a safe area that catches the pointer so the menu doesn’t think you left), and often
  - A slightly more forgiving close delay (“hover intent”).

Best-practice fix (what we’ll implement)
We’ll use a layered approach that is robust and common in production nav menus:

1) Remove or reduce the gap that causes the dead zone
- In `Header.tsx`, pass `sideOffset={0}` (or very small like 1–2) to `DropdownMenuContent`.
- This alone often eliminates 80–90% of flicker because the cursor can move from trigger to menu without leaving the hoverable region.

2) Add an invisible “hover bridge” above the menu content (to handle border-skimming and micro-gaps)
- Add a Tailwind-based pseudo-element to the menu content that extends the hoverable area upward by ~8px without changing visuals.
- This means even if there’s a 1–4px dead zone (from border, rounding, subpixel layout, etc.), the cursor still hits an element that counts as “inside the menu”.

3) Move hover tracking onto the actual Trigger and Content (instead of only the wrapper)
- Keep the menu open while either the trigger OR the content is hovered.
- This avoids edge cases where leaving the content but still being on the trigger could close the menu due to event timing.

4) Make the close delay slightly more forgiving (and cancel reliably)
- Increase the close delay from 150ms to ~200–250ms (still feels instant, but prevents flicker on imperfect cursor movement).
- Ensure we always clear any pending timeout on any pointer-enter of trigger/content, and on unmount.

Concrete code changes (implementation details)
File: src/components/layout/Header.tsx

A) Track hover state for trigger and content (two booleans)
- Add state like:
  - isMoreTriggerHovered
  - isMoreContentHovered
- Compute “shouldBeOpen” = isMoreTriggerHovered || isMoreContentHovered
- Keep `DropdownMenu` controlled with `open={moreDropdownOpen}` but drive it from that hover logic.

B) Use pointer events instead of mouse events (optional but recommended)
- Prefer `onPointerEnter` / `onPointerLeave` for more consistent behavior across devices.
- Still keep click behavior supported via `onOpenChange`, so keyboard/click users can open it.

C) Set sideOffset to remove the gap
- Update:
  <DropdownMenuContent align="end" sideOffset={0} ...>

D) Add the invisible hover bridge to DropdownMenuContent
- Add classes to make content `relative` and add a `before:` pseudo-element:
  - Example Tailwind intent:
    - `relative`
    - `before:content-[''] before:absolute before:inset-x-0 before:-top-2 before:h-2`
    - (Optionally) `before:bg-transparent`
- This creates an invisible 8px strip above the menu that still counts as hovering “inside the menu”.

E) Adjust the debounce close logic to only close when neither trigger nor content is hovered
- Instead of immediately scheduling close on any leave, schedule close and then check the two hover flags at timeout time; only close if both are false.
- Bump delay to ~200–250ms.

F) Keep cleanup
- Keep the existing `useEffect` cleanup to clear timeouts on unmount.

Acceptance criteria (how we’ll verify it’s fixed)
- Hover on “More” opens immediately.
- Moving the cursor from “More” down into the dropdown does not flicker.
- Moving the cursor near the border edges of the dropdown does not cause rapid open/close.
- Leaving the dropdown entirely closes it within ~200–250ms.
- Click still opens/closes (works for touch and accessibility).
- Keyboard: Tab to “More” + Enter/Space still opens; Escape closes (Radix default behavior remains intact).

Potential small follow-ups (if you still feel any micro-flicker)
- If your design needs a visible gap for aesthetics, keep sideOffset small (2–4) but rely on the hover bridge to maintain continuity.
- If the menu is right at the viewport edge and Radix flips sides, we may also add a hover bridge on whichever side is “closest” (usually top) which already covers most cases.

Out of scope (but optional, “Zillow-grade”)
- Replace `DropdownMenu` with `@radix-ui/react-navigation-menu` for true header nav behavior (hover-first, focus management tuned for nav bars). This is a larger change and not required for a clean fix.

Files affected
- src/components/layout/Header.tsx (primary)
- No need to change `src/components/ui/dropdown-menu.tsx` unless you want to change the default sideOffset globally (we can keep it local to “More” only).

Risks / edge cases
- Touch devices don’t “hover”: we’ll keep click-to-open working via `onOpenChange`.
- If you later add nested submenus, we’ll replicate the hover bridge logic for sub content as needed.
