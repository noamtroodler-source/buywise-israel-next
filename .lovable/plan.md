

## Fix Popup Image Carousel Glitching — Creative Approach

### Root Cause

Leaflet popups internally call `_updateLayout()` to measure and reposition themselves. The sliding strip approach (all images in a horizontal row with `translateX`) creates a content container that's actually `N * 260px` wide. Even with `overflow: hidden`, Leaflet's layout engine can detect size changes and trigger repositioning — that's the "jump."

On top of that, each `PropertyThumbnail` component has its own `useState` for error handling, meaning each image independently goes through a load cycle when it first appears.

### Solution: Stacked Images with Opacity Crossfade

Instead of a horizontal sliding strip, **stack all images on top of each other using absolute positioning** and crossfade between them using opacity. This means:

- The container is always exactly `260px x 140px` — Leaflet never sees a size change
- No `translateX` or width manipulation at all
- Images preload invisibly in the background (they're all mounted, just `opacity: 0`)
- Switching is a simple opacity toggle — no layout recalculation possible

### File Changes

**`src/components/map-search/MapPropertyPopup.tsx`**

Replace the sliding strip (lines 104-119) with a stacked approach:

```text
Before (sliding strip):
  <div className="flex h-full transition-transform ..."
       style={{ transform: `translateX(-${imageIndex * 100}%)` }}>
    {images.map(...)}
  </div>

After (stacked with opacity):
  {images.map((img, i) => (
    <div
      key={i}
      className="absolute inset-0 transition-opacity duration-300 ease-in-out"
      style={{ opacity: i === imageIndex ? 1 : 0 }}
    >
      <PropertyThumbnail ... className="w-full h-full object-cover" />
    </div>
  ))}
```

Key details:
- Each image is `absolute inset-0` — fills the 260x140 container exactly
- Only the active image has `opacity: 1`, others have `opacity: 0`
- `transition-opacity duration-300` gives a smooth crossfade
- All images are always mounted and loading in the background — no flash on first view
- The container dimensions never change — Leaflet has nothing to recalculate

**`src/index.css`** — No changes needed. The existing width/pointer-events fixes stay.

### Why This Won't Glitch

1. **Zero layout changes**: Container is always `260 x 140`. Nothing shifts.
2. **No width tricks**: No `translateX`, no flex row, no `will-change-transform`.
3. **Preloaded images**: All images mount immediately (hidden via opacity), so they load in the background before the user clicks an arrow.
4. **Leaflet-safe**: Since the popup content dimensions never change, Leaflet's `_updateLayout()` has no reason to fire.

