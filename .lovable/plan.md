
## Fix Glitchy Map Popup and Consolidate into One Clean Card

### Problems Identified
1. **Two popups rendering at the same time**: When you click a marker, both `MapHoverPopup` (compact card, line 404) AND `MapPropertyPopup` (full card with "View Details", line 448) render simultaneously at the same position. This causes the visual glitch and the weird blue area you're seeing -- they're overlapping each other.
2. **Hover causes flickering**: Every time you hover a different price pill, the marker icon re-renders (scale change, color change), which can feel glitchy when moving quickly between markers.

### Solution
Remove the redundant `MapHoverPopup` rendering entirely. The `MapPropertyPopup` is already the proper click popup with image, price, stats, address, close button, favorite button, "View Details" link, and commute info. There's no need for two popups.

### Files to Change

**`src/components/map-search/PropertyMap.tsx`**
- Remove the `MapHoverPopup` rendering block (lines 403-407) -- the `MapPropertyPopup` at line 448 already handles the click popup correctly
- Remove the `MapHoverPopup` import (line 11) since it's no longer used

**`src/components/map-search/MapPropertyPopup.tsx`**
- Minor styling polish to ensure the card looks clean:
  - Add `shadow-lg` for better elevation
  - Ensure `autoPan={false}` on the Popup so clicking a marker doesn't shift the map around
  - Add proper offset so the popup sits above the marker pointer

That's it -- a small, targeted fix that removes the duplicate popup causing the glitch.
