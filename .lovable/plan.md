

## Fix Map Popup Glitching

### Root Causes Identified

1. **`hover:scale-[1.01]` on the popup Link** -- This CSS transform causes the entire popup card to physically shift/scale when your mouse enters or leaves the card. Inside a Leaflet popup (which has its own transform-based positioning), this creates a visible "jump" every time you hover in/out.

2. **Mouse events leaking between popup and markers** -- When you hover your mouse over the popup card, the mouse also crosses over map markers underneath. Each marker hover fires `onMarkerHover`, which updates `hoveredPropertyId` state in the parent, which re-renders `MarkerClusterLayer`, which can cause the popup to flicker/re-layout.

3. **Carousel arrows toggling on `isHovered`** -- The arrows appear/disappear as you move your mouse, causing layout shifts inside the popup. Combined with the scale effect, this creates a cascading glitch loop.

4. **CSS width conflict** -- The global rule sets `.leaflet-popup-content` to `width: 300px !important` while the property-popup override sets it to `280px !important`. The component itself uses `w-[260px]`. This mismatch can cause content reflows.

### Solution (2 files)

**`src/components/map-search/MapPropertyPopup.tsx`**:
- Remove `hover:shadow-lg hover:scale-[1.01]` and `transition-all duration-200` from the Link wrapper -- these transform effects inside a Leaflet popup are the primary cause of the visual glitching
- Replace with a simpler, non-transform hover: just a subtle background tint or no hover effect at all (the card is already clickable and obvious)
- Keep `isHovered` state but use it only for the carousel arrows -- add `pointer-events: none` on the popup's Leaflet container via CSS so map markers underneath don't receive mouse events while the popup is open
- Show carousel arrows with opacity transition instead of conditional rendering (mount/unmount causes layout shift) -- always render them but toggle opacity

**`src/index.css`**:
- Fix the width conflict: set `.property-popup .leaflet-popup-content` to `width: 260px !important` to match the component's actual width
- Add `pointer-events: auto` on the property popup content so it captures mouse events and prevents them from reaching markers below
- Remove the global `background: transparent !important` override from `.leaflet-popup-content-wrapper` and instead scope it only to non-property popups, so the property popup background rule doesn't need to fight it

### Technical Details

Key changes in `MapPropertyPopup.tsx`:
- Line 102: Remove `transition-all duration-200 hover:shadow-lg hover:scale-[1.01]` from the Link className
- Lines 137-154: Always render carousel arrows but use `opacity-0 group-hover:opacity-100 transition-opacity` instead of conditional `isHovered &&` rendering -- this prevents DOM mount/unmount layout shifts
- The `isHovered` state can be removed entirely since CSS `group-hover` handles arrow visibility

Key changes in `src/index.css`:
- Line 458: Remove `background: transparent !important` from the global `.leaflet-popup-content-wrapper` (it conflicts with the property popup background)
- Line 463: Change global `.leaflet-popup-content` width from `300px` to `auto`
- Line 1019: Set `.property-popup .leaflet-popup-content` width to `260px !important`
- Add a rule to prevent mouse event leakage: `.property-popup { pointer-events: auto; }` and ensure the popup's z-index stays above markers

