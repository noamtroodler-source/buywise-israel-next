
## Map Property Popup Redesign

The current popup looks unprofessional because it uses Leaflet's default popup styling with an awkward pointer/tail, inconsistent padding, and the close button fighting with the Favorite button. We'll redesign this to match the polished mini-property-card aesthetic used elsewhere in Bob Wiser.

---

## Design Approach

### Current Issues
1. Visible triangular "tail/pointer" at the bottom (Leaflet default)
2. Close button (X) overlaps awkwardly with the Favorite heart button
3. Content area has inconsistent spacing
4. View Details button styling feels out of place
5. Doesn't match the polished CardContent styling used in PropertyCard

### New Design
A clean, floating card that:
- Has no visible pointer/tail (hide the leaflet-popup-tip)
- Features a proper image header with rounded top corners
- Places close button in a non-conflicting position
- Uses consistent typography and spacing from PropertyCard
- Keeps the same compact information hierarchy

---

## Implementation

### 1. Update CSS for Leaflet Popup (src/index.css)
- Hide the default leaflet popup pointer/tip
- Add styles for clean floating card appearance
- Ensure the popup shadow and border-radius match the design system

```css
/* Hide the triangular pointer */
.property-popup .leaflet-popup-tip-container {
  display: none !important;
}

/* Clean floating card styling */
.property-popup .leaflet-popup-content-wrapper {
  border-radius: 12px !important;
  overflow: hidden !important;
}
```

### 2. Redesign MapPropertyPopup Component (src/components/map-search/MapPropertyPopup.tsx)
- Remove negative margin hacks that fight with the popup wrapper
- Use proper aspect ratio for image (matching PropertyCard)
- Move close button to top-right corner of the image with proper z-index and no overlap with Favorite
- Use the same typography hierarchy as PropertyCard (price, stats, address)
- Style the View Details button to match the primary button pattern
- Clean up padding and spacing to match the card design system

Key structural changes:
- Image container: Use `aspect-[4/3]` like PropertyCard compact mode
- Close button: Position in top-right corner with semi-transparent background
- Favorite button: Keep it but position properly (not overlapping with close)
- Status badge: Keep in top-left
- Content: Match PropertyCard spacing (`p-3`, proper font sizes)

---

## Files to Modify
1. **src/index.css** - Add/update popup styles to hide pointer and style the card
2. **src/components/map-search/MapPropertyPopup.tsx** - Complete redesign of the component structure and styling

---

## Expected Result
A clean, floating mini-property card popup that:
- Looks like a polished card floating over the map (no pointer)
- Matches the PropertyCard design language
- Has clear, non-overlapping action buttons
- Uses proper shadows and rounded corners
- Feels premium and on-brand for Bob Wiser
