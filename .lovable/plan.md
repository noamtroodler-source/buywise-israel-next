

## Fix Map Marker Glitching -- Root Cause and Solution

### The Real Problem

When you hover over a property in the list (or a marker on the map), the parent component sets `hoveredPropertyId` in state. This causes **every single `PropertyMarker`** on the map to re-render, even though only 2 markers actually changed (the one being hovered, and the one being un-hovered). With dozens or hundreds of markers, this triggers a cascade of unnecessary React reconciliation work, causing visible flickering/glitching.

The icon itself is stable (good -- we fixed that), but React is still re-rendering every `PropertyMarker` component on every hover change because none of them are memoized.

### Solution: Wrap PropertyMarker in React.memo

`React.memo` will skip re-rendering a marker if its props haven't changed. Since most markers go from `isHovered=false` to `isHovered=false` on any given hover event, they'll be skipped entirely.

### Changes

**`src/components/map-search/PropertyMarker.tsx`**
- Wrap the component export with `React.memo` and a custom comparator
- The comparator checks: `property.id`, `property.price`, `property.listing_status`, `isHovered`, `isSelected` -- only re-render if one of these actually changed
- This reduces re-renders from N markers to exactly 2 (previous hovered + new hovered)

**`src/components/map-search/PropertyMap.tsx`**
- Stabilize the `onPropertyHover` and `onPropertySelect` callbacks passed to markers (they're already stable via `useCallback` in `MapSearchLayout`, so no change needed here)

**`src/components/map-search/MapPropertyPopup.tsx`**
- Add a `key={propertyId}` to the Popup so that when you click a different marker, the popup cleanly unmounts/remounts at the new position instead of animating/glitching between positions

### Technical Details

| File | Change |
|------|--------|
| `src/components/map-search/PropertyMarker.tsx` | Wrap with `React.memo` + custom comparison function |
| `src/components/map-search/MapPropertyPopup.tsx` | Ensure clean popup transition between properties |

### Result
- Hovering: only 2 markers re-render (old + new), not all of them -- no more glitching
- Clicking: popup cleanly switches between properties
- Scales well as marker count grows

