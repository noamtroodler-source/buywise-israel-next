

# Add Swipe Support to Map Popup Image Carousels

## Problem
The map property popups (both Leaflet and Google Maps versions) only support arrow button navigation for images. On mobile, users expect to swipe through photos -- arrow buttons are too small and require precise tapping.

## Solution
Wire the existing `useTouchSwipe` hook into both popup carousel containers. This gives horizontal swipe detection with vertical-scroll protection (already built into the hook).

## Files to Change

### 1. `src/components/map-search/MapPropertyPopup.tsx`
- Import `useTouchSwipe` from `@/hooks/useTouchSwipe`
- Call the hook with `onSwipeLeft` -> `nextImage` (adapted for touch) and `onSwipeRight` -> `prevImage`
- Spread the touch handlers (`onTouchStart`, `onTouchMove`, `onTouchEnd`) onto the image carousel container div (the `h-[140px]` div)

### 2. `src/components/map-search/MapPropertyOverlay.tsx`
- Same pattern: import `useTouchSwipe`, call with prev/next callbacks, spread onto the image container div

## Technical Detail

The existing `prevImage`/`nextImage` callbacks use `React.MouseEvent` typing and call `e.preventDefault()`. For touch, we need simple no-arg wrappers:

```tsx
const swipePrev = useCallback(() => {
  goTo((indexRef.current - 1 + totalImages) % totalImages);
}, [totalImages, goTo]);

const swipeNext = useCallback(() => {
  goTo((indexRef.current + 1) % totalImages);
}, [totalImages, goTo]);

const touchHandlers = useTouchSwipe({
  onSwipeLeft: swipeNext,
  onSwipeRight: swipePrev,
  threshold: 30,  // lower threshold for small popup area
});
```

Then on the carousel div:
```tsx
<div className="relative w-full h-[140px] ..." {...touchHandlers}>
```

No new dependencies. ~10 lines per file.

