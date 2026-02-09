

## Comprehensive Tablet View Overhaul

Tablet devices (768px-1023px) currently get treated as "desktop" by the `useIsMobile()` hook (breakpoint at 768px), but the actual desktop nav and layouts don't work well at this width. The result: cramped 2-column grids, desktop nav that's too tight, and sidebars that steal space from content. Here's a Zillow/Redfin-inspired fix across all major pages.

---

### Core Problem

The `md` breakpoint (768px) is where mobile ends and "desktop" begins, but true desktop layouts (3-col grids, sticky sidebars, full nav) only work well at `lg` (1024px+). Tablet needs its own treatment: 2-column grids where appropriate, no sidebar, and a navigation that fits the space.

---

### Phase 1: Navigation & Layout (Header + Bottom Nav)

**`src/components/layout/Header.tsx`**
- Change desktop nav from `hidden md:flex` to `hidden lg:flex` -- the full horizontal nav menu doesn't fit at 768px-1023px. At tablet widths, show only logo + action icons (preferences, favorites, profile).
- Change the sign-in/signup buttons from `hidden md:flex` to `hidden lg:flex`.

**`src/components/layout/MobileBottomNav.tsx`**
- Change from `md:hidden` to `lg:hidden` so the bottom nav bar is visible on tablets too, providing navigation that the hidden desktop nav can't.

**`src/components/layout/Layout.tsx`**
- Update the footer bottom-nav clearance from `md:mb-0` to `lg:mb-0` to match the new bottom nav visibility.

---

### Phase 2: Homepage Sections

**`src/components/home/HeroSplit.tsx`**
- The hero already scales well with `sm:` breakpoints. No changes needed.

**`src/components/home/FeaturedShowcase.tsx`**
- Currently: tablet shows `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`. This is fine for tablet, but the mobile carousel stops at `sm:hidden` / `hidden sm:grid`. The carousel should extend up to `md` to give iPads the swipeable experience.
- Change mobile carousel from `sm:hidden` to `md:hidden` and desktop grid from `hidden sm:grid` to `hidden md:grid`.
- This gives tablets the carousel experience (more Zillow-like) rather than a cramped 2-col grid.

**`src/components/home/ProjectsHighlight.tsx`**
- Same pattern: extend the mobile carousel from `lg:hidden` to include tablets properly. The bento grid only works well at `lg+`. 
- Ensure the carousel is visible below `lg` and the bento grid only at `lg+`.

**`src/components/home/ThreePillars.tsx`**
- Currently uses `useIsMobile()` to decide carousel vs grid. At tablet, it shows the 3-col grid (`md:grid-cols-3`) which is tight at 768px.
- Change to use `useBreakpoint()` and show carousel for `isMobileOrTablet`, grid for desktop only.

**`src/components/home/RegionExplorer.tsx`**
- Mobile carousel uses `sm:hidden`, desktop grid uses `hidden sm:grid sm:grid-cols-4`. At 768px, 4 columns is too cramped.
- Change carousel to show below `md`, grid at `md+` with `md:grid-cols-2 lg:grid-cols-4`.

**`src/components/home/ToolsSpotlight.tsx`**  
- Uses `useIsMobile()` to show 2 tools on mobile, 3 on desktop. Tablet should show all 3 tools in a proper grid.
- Change grid from `sm:grid-cols-2 lg:grid-cols-4` to `sm:grid-cols-2 lg:grid-cols-3` and show all tools at tablet.

---

### Phase 3: Listings Page

**`src/pages/Listings.tsx`**
- Property grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` -- this is already fine for tablet (2 columns at md).
- Sticky filter bar: currently only activates when `isMobile`. Extend to tablets using `useBreakpoint()` or change `isMobile` check to include tablet, since the sticky filters are very useful on tablet-sized screens too.
- The `ViewToggle` is hidden on mobile (`!isMobile`). Keep it visible on tablet.

---

### Phase 4: Property Detail Page

**`src/pages/PropertyDetail.tsx`**
- Sidebar uses `hidden lg:block` and main content uses `lg:col-span-2` -- this is already correct (sidebar only on large desktop).
- `MobileContactBar` needs to be visible on tablet. Currently it likely shows based on `lg:hidden` or similar -- verify and ensure it's visible below `lg`.
- `MobileSectionNav` -- extend to tablet if it's currently `md:hidden`.

**`src/components/shared/MobileHeaderBack.tsx`**
- Currently `md:hidden`. Change to `lg:hidden` so tablets get the back navigation header.

**`src/components/shared/DualNavigation` (desktop nav)**
- Currently `hidden md:block`. Change to `hidden lg:block` since on tablets the `MobileHeaderBack` should be the navigation.

---

### Phase 5: Projects Page

**`src/pages/Projects.tsx`**
- Grid: `md:grid-cols-2 lg:grid-cols-3` -- already fine for tablet.
- Sticky filters: same as Listings, extend to tablet.
- Load More button: add `w-full md:w-auto` for consistency.

**`src/pages/ProjectDetail.tsx`**
- Sidebar: already `hidden lg:block` -- correct.
- `DualNavigation`: Change from `hidden md:block` to `hidden lg:block`.
- Mobile contact bar: ensure visible below `lg`.

---

### Phase 6: Other Pages (Areas, Guides, Tools, Favorites)

**`src/pages/Guides.tsx`**
- Carousel vs grid decision uses `useIsMobile()`. Change to show carousel on tablet too (via `useBreakpoint()` or `useMediaQuery`), since guides look better as swipeable cards at 768px than as a tight 2-col grid.

**`src/pages/Areas.tsx`**
- Region city cards: ensure `md:grid-cols-2 lg:grid-cols-3` for proper tablet spacing.

**`src/pages/Favorites.tsx`**
- Grid: `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` -- fine for tablet at 2 columns.

**`src/pages/Tools.tsx`**
- Tool selector: if it uses carousels on mobile, extend to tablet.

---

### Phase 7: Collapsible Sections on Tablet

**`src/components/property/MobileCollapsibleSection.tsx`**
- Currently shows expanded on desktop, collapsible only when `useIsMobile()`. Change to collapse on tablet too since screen real estate is limited.
- Use `useMediaQuery('(min-width: 1024px)')` instead of `useIsMobile()` to determine when to always show expanded.

---

### Technical Summary

The core change pattern is consistent across all files:

| Current | Change To | Reason |
|---------|-----------|--------|
| `md:hidden` (for mobile-only UI) | `lg:hidden` | Show mobile UI on tablet too |
| `hidden md:flex` (for desktop nav) | `hidden lg:flex` | Desktop nav only at 1024px+ |
| `hidden md:block` (desktop-only) | `hidden lg:block` | Desktop layout at 1024px+ |
| `useIsMobile()` for layout decisions | `useBreakpoint().isMobileOrTablet` or `useMediaQuery` | Include tablet in mobile-style layouts |
| `md:grid-cols-4` | `md:grid-cols-2 lg:grid-cols-4` | Proper tablet column counts |

### Files to Modify

1. `src/components/layout/Header.tsx` -- nav visibility breakpoints
2. `src/components/layout/MobileBottomNav.tsx` -- visibility breakpoint
3. `src/components/layout/Layout.tsx` -- footer clearance
4. `src/components/home/FeaturedShowcase.tsx` -- carousel vs grid breakpoint
5. `src/components/home/ProjectsHighlight.tsx` -- same
6. `src/components/home/ThreePillars.tsx` -- carousel on tablet
7. `src/components/home/RegionExplorer.tsx` -- grid columns
8. `src/components/home/ToolsSpotlight.tsx` -- grid and tool count
9. `src/pages/Listings.tsx` -- sticky filters on tablet
10. `src/pages/Projects.tsx` -- sticky filters, load more
11. `src/pages/PropertyDetail.tsx` -- sidebar, nav breakpoints
12. `src/pages/ProjectDetail.tsx` -- sidebar, nav breakpoints
13. `src/pages/Guides.tsx` -- carousel on tablet
14. `src/components/property/MobileCollapsibleSection.tsx` -- collapse on tablet
15. `src/components/shared/MobileHeaderBack.tsx` -- visibility breakpoint
16. `src/components/shared/DualNavigation.tsx` -- visibility breakpoint (if it uses `md:block`)

### Implementation Order
Batch 1: Navigation layer (Header, BottomNav, Layout) -- this is the foundation.
Batch 2: Homepage sections -- high visibility.
Batch 3: Listing/Detail pages -- core user flows.
Batch 4: Secondary pages + collapsible sections.

