
## Goal
Ensure the Rooms/Bathrooms help tooltips on Buy/Rent listings:
1) Never open “by themselves” (no auto-open on popover open, scroll/sticky changes, or focus),
2) Only open after a deliberate mouse hover,
3) Don’t flicker/glitch when moving between the icon and the tooltip content.

## Why it’s still happening (likely causes)
From the current implementation in `PropertyFilters.tsx`, the tooltip can still open without an intentional hover because Radix tooltips can open when:
- **The popover opens underneath a stationary cursor** (the trigger appears under the mouse; Radix interprets it like “hover”),
- **The trigger receives focus** (Popover often moves focus when opening; Radix Tooltip opens on focus by default),
- **Small trigger hit-area + rapid enter/leave** causes perceived “glitchiness.”

Delay alone helps, but it doesn’t prevent the “popover appears under mouse” and “focus opens tooltip” cases.

## Approach (foolproof)
Implement a **controlled, hover-only tooltip** specifically for these help icons:
- Tooltip `open` state is controlled by our code.
- We only set `open=true` on **mouse pointer enter** when:
  - the pointer has actually moved since the popover opened (“armed” state), and
  - the pointer type is `mouse` (ignore touch/pen).
- We explicitly ignore focus-driven open events.
- We keep the tooltip stable by allowing hoverable content (so you can move from icon to tooltip without it closing instantly) and by increasing the trigger hit-area.

## Step-by-step implementation plan

### 1) Add a small “HoverOnlyTooltip” helper (local to PropertyFilters)
**File:** `src/components/filters/PropertyFilters.tsx`

Create a small internal component (or hook) near the top of the file to wrap Radix Tooltip with:
- `open` + `onOpenChange` controlled (but we’ll gate opening)
- trigger event handlers:
  - `onPointerEnter`: if `armed && e.pointerType === 'mouse'` then open (after delay or immediately)
  - `onPointerLeave`: close (with small grace period if needed)
  - `onFocus`: do nothing (prevents focus-open)
- content handlers:
  - optionally keep open while hovering content (Radix default behavior can be preserved)
- larger trigger button hit area: `p-1 -m-1` or similar.

### 2) Add “arming” logic tied to the Beds/Baths popover open state
**Problem solved:** tooltip opens when popover appears under the cursor.

Inside `PropertyFilters`, when `bedsAndBathsOpen` becomes `true`:
- Set `tooltipsArmed = false`
- Add a one-time `pointermove` listener on `window` that sets `tooltipsArmed = true` on the first move
- Clean up listener on close/unmount

Result: If the popover opens under your cursor and you don’t move the mouse, the tooltip will not open.

### 3) Replace the Rooms tooltip usage with HoverOnlyTooltip
**Where:** the Rooms label block (around the existing HelpCircle icon)

Replace:
- `<Tooltip> ... </Tooltip>` (uncontrolled)
with the controlled hover-only component.

### 4) Add a Bathrooms help icon (if you want it to exist) and apply the same HoverOnlyTooltip
Right now Bathrooms has no help icon/tooltip in this desktop popover section, but you’ve referred to “rooms and bathrooms tooltip.” We’ll make behavior consistent by:
- adding a small HelpCircle next to Bathrooms label
- using the same HoverOnlyTooltip wrapper so it can’t auto-open either

(If you prefer not to add a Bathrooms tooltip visually, we’ll still ensure any existing Bathrooms tooltip elsewhere uses the same pattern—but in this specific popover section it currently doesn’t exist.)

### 5) Stabilize “glitchy” behavior (flicker / rapid close-open)
Adjust these specifics:
- Ensure trigger has a bigger hover area (reduces accidental pointerleave).
- Keep `TooltipProvider delayDuration` but slightly tune (e.g., 300–450ms is fine).
- Add a tiny close grace (optional): on pointerleave of trigger, close after ~80–120ms unless pointer enters tooltip content—this prevents flicker when moving from icon to tooltip.

### 6) Test matrix (what we will verify after changes)
On `/listings?status=for_sale` and `/listings?status=for_rent`:

**Desktop mouse**
- Open Beds/Baths popover with cursor already in that region → tooltip must NOT open until you move mouse and hover the icon.
- Hover icon → tooltip opens after delay.
- Move from icon to tooltip content → tooltip stays stable (no flicker).
- Move away → tooltip closes.

**Keyboard**
- Tab into the help icon → tooltip should NOT open on focus (per your requirement).
- Escape closes popover/tooltip as expected.

**Mobile / touch**
- No tooltip opens on tap/scroll (pointerType gating).

## Files we will change
1) `src/components/filters/PropertyFilters.tsx`
   - Add controlled hover-only tooltip logic
   - Add arming logic linked to `bedsAndBathsOpen`
   - Apply to Rooms (and Bathrooms if added)

## Notes / tradeoffs
- Disabling focus-open means keyboard users won’t get the tooltip automatically. If you want, we can provide an accessible alternative (e.g., a small “info” dialog on Enter/Space) later—but the current request is explicitly hover-only.
- This solution is intentionally localized to the Rooms/Baths help icons so we don’t accidentally change tooltip behavior sitewide.

