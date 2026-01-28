
Goal
- Stop the “More” dropdown from flickering so it behaves like a normal hover menu: open stays stable while the cursor is anywhere on the trigger or menu, and closes only after leaving both.

What we know (from the current code + what we already tried)
- We already tried:
  - Hover open/close using controlled `open` state
  - A close delay (now 200ms)
  - `sideOffset={0}` to remove the gap
  - An invisible “hover bridge” on the menu content
- Despite that, the flicker persists.

Root cause (why it can still flicker with the current code)
- There’s a bug in the debounce implementation: **we create multiple close timers and only track the most recent one**.
  - `handleMoreMouseLeave` sets `closeTimeoutRef.current = setTimeout(...)` but **does not clear any existing timeout first**.
  - If the pointer rapidly crosses boundaries (especially the trigger edge / border / tiny movements), `onMouseLeave` can fire multiple times in a row.
  - Each time, a *new* timeout is created, but only the last timeout ID is stored in `closeTimeoutRef.current`.
  - When the pointer comes back in, `handleMoreMouseEnter()` clears only the last timeout ID — **older timeouts remain alive** and will still execute later, forcing `setMoreDropdownOpen(false)` while you are still hovering, causing the “in-and-out” flicker.
- This also explains why the problem can feel “border-related”: borders/rounded corners increase the likelihood of tiny enter/leave events firing quickly.

Proposed solution (robust, best-practice fix)
We’ll fix this in layers, starting with the real bug:

1) Fix the timer bug (critical)
- In `handleMoreMouseLeave`, always clear any existing timeout before scheduling a new one.
- Also set the ref back to `null` after closing, to avoid stale references.

2) Make hover state deterministic (recommended)
Right now, we’re using “enter = open, leave = schedule close” without knowing whether we’re leaving trigger vs leaving the menu content. Because the dropdown content is portaled, relying on wrapper hover alone is fragile.
- Add two booleans:
  - `isMoreTriggerHovered`
  - `isMoreContentHovered`
- Keep the menu open if either is true.
- Only schedule close when both become false.

3) Switch to pointer events for more consistent behavior (recommended)
- Replace `onMouseEnter/onMouseLeave` with `onPointerEnter/onPointerLeave` on:
  - `DropdownMenuTrigger`
  - `DropdownMenuContent`
- Pointer events reduce oddities with nested elements and are more consistent across input types.

4) Reduce event jitter and state conflicts (recommended cleanup)
- Remove the outer wrapper `<div onMouseEnter/onMouseLeave>` around the dropdown (or stop using it for open/close).
  - With portals, wrapper hover detection is inherently unreliable because the menu content is not inside that wrapper in the DOM.
  - Instead, attach hover handlers directly to Trigger and Content.

5) Keep what helped visually, but ensure it’s not masking logic issues
- Keep `sideOffset={0}` and the hover bridge pseudo-element as “insurance,” but the main fix should be the timer + deterministic hover tracking.

Implementation details (exact edits)
File: `src/components/layout/Header.tsx`

A) Replace the current hover handlers with safer logic
- Add state:
  - `const [isMoreTriggerHovered, setIsMoreTriggerHovered] = useState(false);`
  - `const [isMoreContentHovered, setIsMoreContentHovered] = useState(false);`
- Add helper:
  - `const cancelClose = () => { if (closeTimeoutRef.current) { clearTimeout(closeTimeoutRef.current); closeTimeoutRef.current = null; } };`
- Update enter handlers:
  - On trigger/content pointer enter: `cancelClose(); setMoreDropdownOpen(true); setIsMoreTriggerHovered(true)` / `setIsMoreContentHovered(true)`
- Update leave handlers:
  - On trigger/content pointer leave: set the appropriate hovered flag false, then schedule close:
    - First `cancelClose()` (important!)
    - Then `closeTimeoutRef.current = setTimeout(() => { if (!isMoreTriggerHovered && !isMoreContentHovered) setMoreDropdownOpen(false); }, 200-250);`
  - Important: because state updates are async, we’ll compute “next hovered” values inside the handler (or store hovered flags in refs) so the timeout checks the latest truth. This prevents a close from being scheduled based on outdated state.

B) Attach handlers to Trigger + Content (not the wrapper)
- `DropdownMenuTrigger`: add `onPointerEnter` / `onPointerLeave`
- `DropdownMenuContent`: add `onPointerEnter` / `onPointerLeave`
- Remove or neutralize the wrapper `div` hover handlers around the dropdown.

C) Keep the hover bridge and zero offset
- Keep:
  - `sideOffset={0}`
  - `className` includes the `before:` hover bridge
- Also ensure the dropdown content has a solid background and high z-index (Radix already applies `z-50`, but we’ll keep your explicit background classes).

D) Optional: clamp state updates from Radix
- Keep `onOpenChange={setMoreDropdownOpen}` so click/keyboard still works.
- But add a small guard so hover logic doesn’t fight click logic:
  - Example idea: if hover is currently active, don’t allow `onOpenChange(false)` to close it unless both hovered flags are false.
  - This is usually not necessary once the timer bug is fixed, but it’s a safe fallback if Radix sends close events while hover is still active.

Why this will stop flickering (in plain terms)
- The flicker is caused by “ghost closes” from old timers firing after you’ve already hovered back in.
- By always cancelling any existing timer before creating a new one, and by only closing when we are sure the pointer is over neither trigger nor menu, the dropdown can’t randomly close while you’re still interacting with it.

Acceptance criteria (how we’ll verify it’s fixed)
- Hover over “More”: opens immediately.
- Move cursor down into the dropdown: no flicker.
- Skim along the border edges: no flicker, no repeated open/close.
- Leave the menu area entirely: closes after ~200–250ms.
- Click and keyboard still work:
  - Click trigger toggles open/close.
  - Tab to trigger + Enter/Space opens.
  - Escape closes.

Fallback if you want the exact “Zillow-grade” behavior
If after fixing the timer bug you still want a more purpose-built navigation interaction:
- Replace `DropdownMenu` with the existing `NavigationMenu` component (`src/components/ui/navigation-menu.tsx` is already in the project).
- `NavigationMenu` is designed specifically for hoverable header nav and tends to behave more like large production sites out of the box.
- We’ll only do this if needed; the timer fix + hover tracking should already eliminate the flicker.

Files to change
- `src/components/layout/Header.tsx`
