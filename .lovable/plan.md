

## Unified Elevated Surface Design System

The goal: every floating/elevated surface uses the same premium shadow recipe, border softness, and border-radius that we established in the nav menus.

### The Design Token

The premium shadow used in the nav menus:
```
shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]
```
Combined with `rounded-xl border-border/50` as the universal elevated surface treatment.

### Files to Update (8 base UI primitives)

**1. `src/components/ui/popover.tsx`** — PopoverContent
- `rounded-md` → `rounded-xl`
- `shadow-md` → premium layered shadow
- `border` → `border border-border/50`

**2. `src/components/ui/tooltip.tsx`** — TooltipContent
- `rounded-md` → `rounded-lg` (tooltips are small, xl would be too much)
- `shadow-md` → premium layered shadow
- `border` → `border border-border/50`

**3. `src/components/ui/hover-card.tsx`** — HoverCardContent
- `rounded-md` → `rounded-xl`
- `shadow-md` → premium layered shadow
- `border` → `border border-border/50`

**4. `src/components/ui/dropdown-menu.tsx`** — DropdownMenuContent + DropdownMenuSubContent
- `rounded-md` → `rounded-xl`
- `shadow-md`/`shadow-lg` → premium layered shadow
- `border` → `border border-border/50`
- DropdownMenuItem: `rounded-sm` → `rounded-lg` for hover states

**5. `src/components/ui/select.tsx`** — SelectContent
- `rounded-md` → `rounded-xl`
- `shadow-md` → premium layered shadow
- `border` → `border border-border/50`

**6. `src/components/ui/dialog.tsx`** — DialogContent
- `sm:rounded-lg` → `sm:rounded-2xl`
- `shadow-lg` → premium layered shadow
- `border` → `border border-border/50`

**7. `src/components/ui/alert-dialog.tsx`** — AlertDialogContent
- `sm:rounded-lg` → `sm:rounded-2xl`
- `shadow-lg` → premium layered shadow
- `border` → `border border-border/50`

**8. `src/components/ui/card.tsx`** — Card base
- `rounded-lg` → `rounded-xl`
- `shadow-sm` → premium layered shadow
- `border` → `border border-border/50`

**9. `src/components/ui/toast.tsx`** — Toast
- `rounded-md` → `rounded-xl`
- `shadow-lg` → premium layered shadow

**10. `src/components/ui/sonner.tsx`** — Sonner toast
- Add `group-[.toaster]:rounded-xl` and update shadow to premium layered shadow

**11. `src/components/ui/sheet.tsx`** — SheetContent
- `shadow-lg` → premium layered shadow (side panels benefit from the softer depth)

**12. `src/components/ui/command.tsx`** — CommandDialog
- `shadow-lg` → premium layered shadow (inherits dialog but worth confirming)

### What This Does NOT Touch
- Input fields (`rounded-md border border-input`) — these are inline form elements, not elevated surfaces
- Buttons — not floating surfaces
- Badges — inline elements
- Individual component files that already override with `className` (e.g. `rounded-2xl` on specific dialogs) — those overrides will still work on top of the new base

### Why at the Primitive Level
By updating the base UI components, every usage site across 150+ files automatically inherits the premium surface treatment. No need to hunt down individual instances.

