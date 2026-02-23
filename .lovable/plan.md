

# Smart Popup Auto-Repositioning

## Problem
The overlay card always renders above the marker, centered horizontally. When a marker is near the top or edges of the map, the card gets clipped off-screen.

## Solution
Add edge-detection logic that measures available space around the marker pixel position and flips the card's placement accordingly (above/below, left/right shift). The arrow tip also rotates to match.

## How It Works

1. **Measure available space** after computing the marker's pixel position against the map container dimensions
2. **Decide vertical placement**: If there's not enough room above (card height + padding), flip to below the marker
3. **Decide horizontal placement**: If the card would overflow left or right edges, shift it so it stays fully visible, and offset the arrow tip to still point at the marker
4. **Rotate the arrow tip**: Point up when card is below, point down when card is above

## Technical Details

**File: `src/components/map-search/MapPropertyOverlay.tsx`**

Constants:
- `CARD_WIDTH = 260`, `CARD_HEIGHT ~ 210` (image 140 + details ~60 + tip 10)
- `EDGE_PADDING = 12` (minimum gap from map edge)

New state: replace fixed `style` with computed `placement` object containing `left`, `top`, `transform`, `arrowLeft`, and `arrowFlipped`.

Logic (runs inside `computePos` or a derived effect):

```text
mapDiv = map.getDiv()
containerW = mapDiv.offsetWidth
containerH = mapDiv.offsetHeight

// Vertical: default above, flip below if not enough room
if (pos.y - CARD_HEIGHT - EDGE_PADDING < 0) {
  // Place below marker
  top = pos.y + TIP_HEIGHT
  arrowFlipped = true  // arrow points up
} else {
  // Place above marker (current behavior)
  top = pos.y - CARD_HEIGHT - TIP_HEIGHT
  arrowFlipped = false // arrow points down
}

// Horizontal: default centered, clamp to edges
idealLeft = pos.x - CARD_WIDTH / 2
left = clamp(idealLeft, EDGE_PADDING, containerW - CARD_WIDTH - EDGE_PADDING)
arrowLeft = pos.x - left  // arrow tip offset within card
```

The arrow `div` at the bottom (or top when flipped) uses `left: arrowLeft` instead of `justify-center`, and its rotation changes based on `arrowFlipped`.

Changes:
- Remove the fixed `transform: translateY(calc(-100% - 10px))` 
- Compute `top` and `left` directly as absolute pixel values
- Move arrow from always-bottom to conditional top/bottom with dynamic horizontal offset
- Card border radius stays the same since it's symmetric

No new dependencies. No other files changed.
