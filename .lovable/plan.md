
## What’s causing the “I draw a box and suddenly only 2 listings remain” glitch

Right now, when a shape is completed, `PropertyMap` does this:

- sets `drawnPolygon`
- **turns off `searchAsMove`** (`onSearchAsMoveChange(false)`)

In `MapSearchLayout`, the backend query only includes the map bounds when `searchAsMove === true`:

```ts
if (!searchAsMove || !mapBounds) return baseFilters;
return { ...baseFilters, bounds: mapBounds };
```

So as soon as you draw:
- bounds filtering is removed from the query
- `usePaginatedProperties` fetches a different set of “newest” properties city-wide (first page only)
- then the polygon filter runs client-side on this new dataset
- result: often only 1–2 happen to fall inside your drawn shape, even though the map clearly had many inside before you drew

This is why it feels like a random/repeatable glitch.

## Fix approach (so this won’t happen again)

### Goal behavior
Any time a drawn shape exists, the results should still be constrained to the relevant area (at minimum: the bounds you were looking at when you drew), and then further filtered by the polygon.

### Changes we’ll make

1) **Keep bounds filtering active whenever a polygon exists**
- Update the `queryFilters` logic in `src/components/map-search/MapSearchLayout.tsx` so that it includes `bounds` when:
  - `searchAsMove` is enabled **OR**
  - `drawnPolygon` is present
- This “freezes” the last known bounds when drawing is active (since we still want to stop auto-refresh while panning).

Concretely: change the conditional from:
- “only include bounds when searchAsMove is on”
to:
- “include bounds when searchAsMove is on OR a polygon is active”

2) **Force-refresh the bounds exactly at the moment the draw completes**
Even with the change above, there’s still a corner case:
- if `searchAsMove` was off before drawing (or bounds are stale), the frozen bounds might not reflect what you’re currently looking at.

So in `src/components/map-search/PropertyMap.tsx`, inside `handleDrawComplete`, we will:
- read the current Leaflet map bounds from `mapRef.current.getBounds()`
- call `onBoundsChange(...)` once immediately (to store the “frozen” bounds correctly)
- then set `drawnPolygon` and disable `searchAsMove`

This ensures the polygon filter is applied to the same geographic area you were viewing when you drew.

3) (Optional but recommended) **Use the polygon’s bounding box instead of the viewport bounds**
Viewport bounds are good enough to fix the glitch, but we can make it even more correct and efficient:
- compute the polygon’s min/max lat/lng
- use that as the bounds filter (smaller query window, fewer irrelevant results)

If your dataset can get large, this reduces the chance you miss properties due to pagination.

We can implement this in `MapSearchLayout` (derive bounds from `drawnPolygon`), or in `PropertyMap` when the draw completes (compute bounds there and push it through `onBoundsChange`).

4) Add a lightweight dev-only diagnostic (to prevent regressions)
To make sure this never silently breaks again, we can add a guard (only in development):
- when `drawnPolygon` is present and `properties.length` drops by a huge percent after drawing, log:
  - rawProperties count
  - filtered count
  - whether bounds were included
This makes future issues immediately obvious in console.

## Files we will touch
- `src/components/map-search/MapSearchLayout.tsx`
  - adjust `queryFilters` bounds logic to include bounds when `drawnPolygon` exists
  - (optional) compute polygon bbox bounds
- `src/components/map-search/PropertyMap.tsx`
  - on draw complete: capture current map bounds and call `onBoundsChange` immediately before freezing search-as-move

## How we’ll verify (quick, practical)
1) Go to `/map?...zoom=13` (like your current route), ensure you see many markers.
2) Draw a rectangle that clearly covers many visible markers.
3) Confirm:
   - the list count stays consistent (it should not collapse to 1–2)
   - properties inside the box remain visible
4) Pan the map while a polygon is active:
   - results should remain “frozen” (no surprise refresh), unless you clear the polygon.
5) Clear polygon:
   - `searchAsMove` resumes and bounds update again as you move.

## Edge cases we’ll cover
- Drawing when `searchAsMove` is already off
- Quickly drawing immediately after zoom/pan (stale bounds timing)
- Very small polygons
- Clearing polygon restores normal behavior

