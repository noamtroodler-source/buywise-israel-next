

## Fix Map Marker Hover Glitching

### Root Cause
In `PropertyMarker.tsx`, the Leaflet `divIcon` is recreated every time `isHovered` or `isSelected` changes (line 178 dependencies). Leaflet replaces the entire DOM node when the icon object changes, causing a visible flicker as you move between markers.

### Solution
Decouple the hover/selected visual styling from the icon creation. The icon should only depend on static property data (price, listing status, badges). Hover and selected states should be applied via CSS class toggling on the existing DOM element, which Leaflet handles without replacing the node.

### Changes

**`src/components/map-search/PropertyMarker.tsx`**

1. Split the icon into two concerns:
   - **Base icon** (`useMemo`): depends only on `displayPrice`, `markerStyle.isRental`, `priceDropInfo`, `isHot`, and base colors (neutral/default state). Remove `isHovered` and `isSelected` from its dependencies.
   - **CSS class**: Add a data attribute or CSS class to the marker wrapper (e.g., `data-hovered`, `data-selected`) and use CSS transitions for the blue highlight and scale effect.

2. Use a `useEffect` to apply/remove a CSS class on the marker's DOM element when `isHovered` or `isSelected` changes, instead of rebuilding the icon:
   - Add class `marker-active` which applies the blue background, white text, border, scale(1.1), and z-index bump
   - This avoids Leaflet's icon replacement entirely

3. Move the hover/selected styles into a global CSS block (or inline `<style>` in the icon HTML) using the class `.marker-active`:
   ```css
   .marker-active .property-marker-pill {
     background-color: hsl(213, 94%, 45%) !important;
     color: white !important;
     border-color: white !important;
   }
   .marker-active .property-marker-wrapper {
     transform: scale(1.1);
   }
   ```

4. Update the `Marker` ref to access its container element and toggle the class in a `useEffect` keyed on `isHovered` and `isSelected`.

**`src/index.css` (or equivalent global styles)**
- Add the `.marker-active` CSS rules for the hover/selected state so they're applied via class toggle, not icon recreation.

### Result
- Hovering a marker: smooth blue highlight via CSS class, no DOM rebuild, no flicker
- Clicking a marker: popup card appears (existing `MapPropertyPopup`), marker stays blue
- Moving between markers: instant CSS transitions, zero glitching
