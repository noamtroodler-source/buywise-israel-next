

## Mega Menu Premium Upgrade

### What changes

**1. MegaMenu.tsx — Box styling & layout**
- Replace `shadow-xl` with layered soft shadow: `shadow-[0_4px_24px_-4px_rgba(0,0,0,0.08),0_2px_8px_-2px_rgba(0,0,0,0.04)]`
- Add `border-t-2 border-primary` top accent line
- Widen: 2-col → `w-[480px]`, 3-col → `w-[680px]`
- Increase column padding from `p-4` → `p-6`
- Remove `divide-x divide-border` column dividers (cleaner without them at wider spacing)

**2. MegaMenu.tsx — Hover states on items**
- Each link item gets `rounded-lg px-3 py-2.5 -mx-1 hover:bg-muted/50` for clear interactive feedback with generous hit area

**3. MegaMenu.tsx — Item spacing**
- Increase `space-y-1` → `space-y-0.5` (the larger padding per-item handles spacing now)

**4. NavigationMenuViewport (navigation-menu.tsx) — Entry animation**
- Replace the default zoom animation with a subtle fade + slide-down using framer-motion
- Actually, since Radix controls the viewport animation via CSS, we'll customize via CSS: change `zoom-in-90` to `fade-in` + a custom `slide-in-from-top-1` for a 4px translateY effect, keeping it lightweight without adding framer-motion overhead

**5. CTA footer**
- Slightly more padding, `bg-muted/20` for subtler background

### Files to edit
- `src/components/layout/MegaMenu.tsx` — box width, padding, shadow, border accent, hover states
- `src/components/ui/navigation-menu.tsx` — viewport animation classes (fade+slide instead of zoom)

