

## Mobile Overhaul -- Phases 2, 4, 5 & 7 (Remaining)

Continuing from the completed Phase 1 (Homepage), Phase 3 (Property Detail), and Phase 7E (CSS cleanup).

---

### Phase 2: Listings Page

**`src/pages/Listings.tsx`**
- Compact mobile header: reduce padding from `py-6` to `py-4`, heading from `text-3xl` to `text-2xl`
- Hide subtitle paragraph on mobile (`hidden md:block`)
- Make "Load More" button full-width on mobile (`w-full md:w-auto`)

**`src/components/filters/QuickFilterChips.tsx`**
- Hide QuickFilterChips when the filter bar is sticky (they're redundant with the pill row above). Pass `isSticky` down or use `hidden` when parent is sticky via a prop.

---

### Phase 4: Navigation

**`src/components/layout/Header.tsx`**
- Remove the mobile hamburger menu button (`md:hidden` block, lines 176-185) and the entire mobile menu dropdown (lines 189-481). The `MobileBottomNav` + "More" sheet already handles all mobile navigation, so the hamburger is redundant.
- On mobile, the header becomes: Logo (left) | Preferences + Favorites (right). Much cleaner.

**`src/components/layout/MobileBottomNav.tsx`**
- No structural changes needed -- it's already solid. Just verify the z-index doesn't conflict with property detail's `MobileContactBar`. The Layout already hides the bottom nav on property detail via `hideMobileNav` prop when needed.

---

### Phase 5: Map Search

**`src/components/map-search/MobileMapSheet.tsx`**
- Increase peek-mode card width from `w-[200px]` to `w-[240px]` for better readability
- Add a floating "List" / "Map" toggle pill above the sheet handle (a small `position: absolute` button that lets users switch between full-list and full-map without needing to swipe)

---

### Phase 7: Global Polish (7A-7D)

**`src/index.css`**
- Add a utility class for consistent mobile heading scale: `.mobile-h1 { @apply text-2xl md:text-4xl }` etc. (optional, low priority)

**General across files (opportunistic)**
- Ensure `viewport={{ once: true }}` on framer-motion scroll-triggered animations (spot-check key components)
- Touch target audit: most buttons already meet 44px, no major gaps found

---

### Technical Summary

| File | Changes |
|------|---------|
| `src/pages/Listings.tsx` | Compact header, hide subtitle, full-width load more |
| `src/components/filters/QuickFilterChips.tsx` | Hide when sticky |
| `src/components/layout/Header.tsx` | Remove mobile hamburger menu + dropdown |
| `src/components/map-search/MobileMapSheet.tsx` | Wider peek cards, Map/List toggle |

### Implementation Order
All changes in a single batch -- they're independent and relatively small.

