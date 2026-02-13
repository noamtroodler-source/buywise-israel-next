
# Complete Map Search Reinvention -- Zillow-Inspired with BuyWise Israel Identity

## Vision

Transform the map search from a functional but utilitarian split-panel layout into a polished, immersive, Zillow-grade experience that feels native to BuyWise Israel. The map becomes the hero, the list becomes a scrollable results feed, and the filter bar becomes a clean, pill-based toolbar.

## Key Design Principles from Zillow (adapted for BuyWise)

1. **Map is the left hero, list is the right scrollable feed** -- Zillow uses ~60/40 map-to-list ratio with the list as a continuous 2-column card grid
2. **Filter bar is a single horizontal row of pill-shaped dropdowns** -- "For Sale", "Price", "Beds & Baths", "Home Type", "More", and a "Save Search" CTA
3. **Cards are image-first with carousel dots** -- Large photo with hover carousel, price below, stats inline, address below that
4. **Map markers are clean price pills** -- White rounded pills with black text, bold on hover/select with brand color
5. **No visible panel resize handle** -- Fixed proportions, clean edge
6. **Results header is minimal** -- Just count + sort dropdown, no clutter
7. **Boundary line** -- A clean vertical divider between map and list, no drag handle

## Detailed Changes

### 1. Filter Bar Overhaul (Desktop)

**Current**: Separate filter components with varying styles, Buy/Rent toggle left-aligned, city picker, dropdowns
**New**: Zillow-style horizontal pill bar

- Full-width bar below the header with consistent pill-shaped filter buttons
- Left side: Search input (address/city autocomplete) with clear button
- Middle: "For Sale" dropdown (toggles Buy/Rent/Projects), "Price" dropdown, "Beds & Baths" dropdown, "Home Type" dropdown, "More" dropdown
- Right side: "Save Search" button (primary CTA, replaces the alert bell scattered elsewhere)
- Each pill has a subtle border, fills with brand color when active/has value
- Popover content matches current filter content but in cleaner popover cards

### 2. Map Panel (Left Side)

**Current**: 55% default, resizable with drag handle, toolbar on right side
**New**: 60% fixed width, no resize handle, cleaner toolbar

- Remove `ResizablePanel` / `ResizableHandle` -- use fixed CSS grid `grid-cols-[60fr_40fr]`
- The vertical divider between map and list becomes a simple 1px border (no drag affordance)
- **Toolbar redesign**: Keep the vertical toolbar on the right edge of the map but refine styling:
  - Single frosted-glass card grouping all tools (no separate groups)
  - Smaller, more refined icons (matching Zillow's minimal zoom +/- buttons)
  - Remove keyboard shortcut button from toolbar (keep shortcuts active, just remove the visible button)
- **Map tiles**: Keep CartoDB light tiles (already clean and Zillow-like)
- **Property markers**: Refine the price pill markers:
  - Slightly larger font (12px), more padding, softer border-radius (8px)
  - On hover: Scale up gently (1.05x), add subtle shadow
  - On select: Fill with BuyWise primary blue, white text
  - Drop the triangular pointer below the pill (Zillow doesn't use it) -- just a floating rounded pill
  - Keep hot/price-drop badges but make them smaller and positioned top-right corner
- **Cluster markers**: Refine to be semi-transparent blue circles with white count text
- **City overlay** (zoomed out): Keep current behavior, refine pill styling to match new marker aesthetic
- **Popup on click**: Redesign the popup card:
  - Wider (300px), taller image (160px), image carousel with dot indicators
  - Price bold + large, stats inline, address below
  - "View Details" button full-width at bottom
  - Remove prev/next arrows (Zillow doesn't cycle through results in popup)
  - Remove "Find in list" link (simplify)
  - Favorite heart on image top-right corner

### 3. Property List Panel (Right Side)

**Current**: 45% resizable, 2-column grid with compact PropertyCards, header with count + sort + alert bell
**New**: 40% fixed, 2-column card grid, Zillow-style cards

- **Results header**: Clean and minimal
  - Left: "{count} results" in bold
  - Right: "Sort: Newest" dropdown (small, ghost style)
  - Remove the alert bell from here (moved to filter bar as "Save Search")
  - Add city/area context text below count if city is set
- **Card redesign** (the most impactful change):
  - Switch from horizontal compact cards to **vertical image-first cards** (like Zillow)
  - Large image (aspect ratio ~16:10) with image carousel on hover (dots at bottom)
  - Favorite heart button overlay on image top-right
  - Below image: Price in bold (large), stats inline (beds | baths | sqft -- separated by pipes), address on next line, property type label
  - Price drop: Show original price with strikethrough next to current price
  - "Just Listed" badge overlay on image top-left when <= 3 days old
  - On hover: Subtle card lift shadow + corresponding map marker highlights
  - Cards are `<Link>` to property detail (entire card clickable)
  - 2-column grid always (no responsive 1-column since panel is fixed width)
- **Infinite scroll**: Keep current sentinel-based approach
- **Empty state**: Keep current design (clean and informative)

### 4. Mobile Experience

**Current**: Bottom sheet with peek/half/full states, compact filter bar, horizontal scroll in peek mode
**New**: Refined but structurally similar (mobile already follows Zillow patterns)

- **Filter bar**: Keep Buy/Rent toggle + City chip + Filters button -- already good
- **Bottom sheet**: Keep peek/half/full -- already matches Zillow mobile
- **Map/List toggle pill**: Keep the floating pill -- already matches Zillow
- **Cards in list view**: Use the new vertical card design but single-column
- **Peek mode**: Keep horizontal scroll cards but use new card design (280px wide, image-first)

### 5. CSS & Styling Refinements

- Marker pill: Drop the pointer triangle, cleaner border-radius, softer shadows
- Active marker: BuyWise blue fill instead of harsh color override
- Cluster marker: Semi-transparent blue with white text
- Toolbar group: Single card instead of multiple groups
- Remove `.property-marker-pointer` and `.property-marker-pointer-inner` styles
- New card hover animation: `translateY(-2px)` with shadow increase

### 6. Removed / Simplified Features

- **Remove panel resizing** -- Fixed 60/40 split (cleaner, less complexity)
- **Remove "Find in list"** from popup -- Over-engineered for the interaction model
- **Remove prev/next navigation** from popup -- Zillow doesn't do this; users click markers directly
- **Remove onboarding hints overlay** -- Replace with nothing (clean first impression)
- **Simplify toolbar** -- Merge tool groups into one card, remove keyboard shortcut icon

## Technical Implementation Plan

### Files to Modify

1. **`MapSearchLayout.tsx`** -- Replace `ResizablePanelGroup` with CSS grid, update filter bar integration, remove panel size persistence
2. **`PropertyMap.tsx`** -- Clean up toolbar props, remove onboarding hints, adjust popup props
3. **`PropertyMarker.tsx`** -- Remove pointer triangle from HTML, refine pill styling, adjust active state CSS
4. **`MapPropertyPopup.tsx`** -- Wider popup, larger image, remove prev/next and "Find in list"
5. **`MapPropertyList.tsx`** -- Replace horizontal compact cards with vertical image-first cards inline (no separate component needed), remove alert bell, simplify header
6. **`MapPropertyCard.tsx`** -- Rewrite as vertical image-first card with hover carousel
7. **`MapToolbar.tsx`** -- Merge groups into single card, remove keyboard shortcut button
8. **`MarkerClusterLayer.tsx`** -- Refine cluster marker styling
9. **`MobileMapSheet.tsx`** -- Update to use new card design
10. **`index.css`** -- Update marker, cluster, toolbar CSS classes
11. **`PropertyFilters.tsx`** -- Adjust for map mode to render as Zillow-style pill bar (or create a new `MapFilterBar.tsx`)
12. **`MapOnboardingHints.tsx`** -- Remove usage (component can stay for now)

### Files to Create

1. **`MapListCard.tsx`** -- New vertical image-first card component for the list panel (replaces `MapPropertyCard` usage in list)

### Migration Notes

- No database changes required
- No new dependencies needed
- All changes are frontend/UI only
- Existing URL parameter persistence and search-as-move logic remain unchanged
- Layer toggles, draw tools, neighborhood boundaries all preserved (just cleaner toolbar)
