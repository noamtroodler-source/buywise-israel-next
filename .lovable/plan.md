

# Phase 6: Mobile Experience

This phase transforms the map search page from desktop-only (list panel `hidden` below `lg`) into a fully mobile-optimized experience with a swipe-based bottom sheet, compact filter bar, and a Map/List toggle.

## What Gets Built

1. **MobileMapSheet** -- A `vaul` Drawer-based bottom sheet overlaying the full-screen map with three snap points: peek (showing horizontal card carousel), half (vertical card list), and full (full-screen list).

2. **MobileMapFilterBar** -- A compact 48px sticky bar at the top of the map on mobile with: Buy/Rent chip toggle, city pill, filters button (opens existing `MobileFilterSheet`), and active filter count badge.

3. **Map/List Toggle Pill** -- A floating segmented pill that switches between showing the map with bottom sheet vs. a full-screen scrollable list view.

4. **Mobile Card Carousel** -- Horizontal snap-scrolling row of 280px property preview cards shown in the sheet's peek mode.

5. **Layout Orchestration** -- `MapSearchLayout` detects mobile breakpoint and renders the mobile-specific components instead of the desktop sidebar.

## Architecture

On mobile (below `lg` / 1024px), the layout changes from side-by-side to layered:

```text
Desktop (lg+):                    Mobile (<lg):
+------------------+----------+   +------------------+
|                  |          |   |  MobileMapFilter  |  <- compact 48px bar
|     Map          |  List    |   +------------------+
|                  |  Panel   |   |                  |
|                  |          |   |      Map          |
+------------------+----------+   |   (full screen)  |
                                  |                  |
                                  +--[bottom sheet]--+
                                  | peek: card       |
                                  | carousel         |
                                  +------------------+
                                  [Map/List toggle pill]
```

## New Files

### `src/components/map-search/MobileMapSheet.tsx`
- Uses `vaul` Drawer component (already installed)
- Renders as an always-open bottom sheet with `modal={false}` so the map stays interactive behind it
- Three snap points via vaul's `snapPoints` prop: `["148px", "50%", 1]`
  - **Peek (148px)**: Shows the horizontal card carousel (`MobileCardCarousel`)
  - **Half (50%)**: Shows vertical single-column card list with sort dropdown
  - **Full (1)**: Full-height scrollable list with infinite scroll sentinel
- Props: `properties`, `totalCount`, `isLoading`, `sortBy`, `onSortChange`, `hasNextPage`, `loadMore`, `hoveredPropertyId`, `onCardHover`
- The drawer handle area shows result count ("42 results") and sort control

### `src/components/map-search/MobileCardCarousel.tsx`
- Horizontal scrollable container with CSS `scroll-snap-type: x mandatory`
- Each card is 280px wide with `scroll-snap-align: start`
- Renders a compact version of `MapListCard` optimized for horizontal browsing
- Shows property image, price, beds/baths/size stats, and location
- Touching a card navigates to the property detail page

### `src/components/map-search/MobileMapFilterBar.tsx`
- Compact 48px bar positioned at the top of the map area on mobile
- Contains:
  - Buy/Rent segmented toggle (pill-style, same as desktop but smaller)
  - City chip (shows selected city or "City" placeholder, taps to open city popover)
  - Filters button with badge count (opens existing `MobileFilterSheet`)
- Receives the same filter props as `PropertyFilters` but renders a minimal mobile layout
- Uses `z-[35]` to sit above the map but below the toolbar

### `src/components/map-search/MobileMapListToggle.tsx`
- Floating pill at bottom-center of the screen (above the bottom sheet handle)
- Two segments: Map icon | List icon
- When "List" is active, the bottom sheet snaps to full height
- When "Map" is active, the bottom sheet snaps to peek height
- Uses `z-[45]` to float above the sheet

## Modified Files

### `src/components/map-search/MapSearchLayout.tsx`
- Import `useIsMobile` hook (or use `useMediaQuery` for `lg` breakpoint)
- On mobile:
  - Hide the desktop `PropertyFilters` bar (it's replaced by `MobileMapFilterBar`)
  - Hide the `MapListPanel` (replaced by `MobileMapSheet`)
  - Render `MobileMapFilterBar` as an overlay on the map
  - Render `MobileMapSheet` with properties data
  - Render `MobileMapListToggle`
  - The map takes full height instead of the grid layout
- On desktop: no changes, keeps current behavior
- Pass Buy/Rent state and filter handlers to `MobileMapFilterBar`

### `src/components/map-search/PropertyMap.tsx`
- Adjust toolbar positioning: on mobile, the toolbar moves up slightly to avoid overlapping the bottom sheet peek area (add a `className` prop or use media query for `bottom-40` on mobile vs `bottom-6` on desktop)

### `src/components/map-search/MapToolbar.tsx`
- Add responsive bottom positioning: `bottom-40 lg:bottom-6` so the toolbar sits above the mobile bottom sheet peek area

## Technical Details

- **vaul Drawer configuration**: Using `vaul`'s `Drawer` with `direction="bottom"`, `modal={false}`, and `snapPoints={["148px", "50%", 1]}`. The `activeSnapPoint` state is tracked to determine which view to render (carousel vs. list).
- **Scroll snap carousel**: Pure CSS solution using `overflow-x: auto`, `scroll-snap-type: x mandatory`, and `scroll-snap-align: start` on each 280px card. No additional library needed.
- **Filter bar integration**: `MobileMapFilterBar` is a thin wrapper that:
  - Renders the Buy/Rent toggle inline
  - Shows the city as a tappable chip (opens a small sheet/popover for city selection)
  - Has a "Filters" button that calls `setMobileFiltersOpen(true)` to open the existing `MobileFilterSheet`
- **Breakpoint**: Uses `useMediaQuery('(min-width: 1024px)')` to match Tailwind's `lg` breakpoint, consistent with the `lg:grid-cols-[3fr_2fr]` on the desktop layout.
- **No new dependencies**: Uses `vaul` (already installed), existing `useIsMobile` / `useMediaQuery` hooks, and CSS scroll-snap.
- **Map height on mobile**: The map fills `100vh - 64px` (header height). The filter bar and bottom sheet overlay on top of it.
- **Performance**: The card carousel only renders the first ~10 properties for peek mode. Full list uses the same infinite scroll pattern as `MapListPanel`.
- **Bottom nav hidden**: The `MapSearch` page already passes `hideMobileNav` to `Layout`, so the bottom navigation won't conflict with the bottom sheet.

