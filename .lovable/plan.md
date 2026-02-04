
Goal: make city-to-city switching reliably (1) animates the map from the current city to the newly selected city, and (2) updates BOTH the right-side listings and the map markers to the new city immediately after the animation.

What’s actually broken right now (root cause)
- Your property query uses `queryFilters.bounds` when `mapBounds` exists (see `MapSearchLayout.tsx` → `queryFilters` memo).
- During a city change we set `isProgrammaticMoveRef.current = true` and then `handleBoundsChange` currently returns early, meaning it does NOT update `mapBounds`.
- Worse: the map’s `moveend` event fires while the flag is still true, so `MapBoundsListener` calls `onBoundsChange(...)`, but `handleBoundsChange(...)` discards it. Then `MapViewUpdater` clears the flag after that same `moveend`, and there is no subsequent event to update bounds.
- Result: your property query continues using the OLD city’s bounds while the city filter is the NEW city → frequently yields 0 results (“No properties in this area”) and no markers/listings.

Fix strategy (make the state flow deterministic)
We will ensure that after every programmatic city fly-to:
1) the “programmatic move” flag is cleared, AND
2) the FINAL bounds/center/zoom of the destination are pushed into MapSearchLayout state (especially `mapBounds`), so the backend query updates to the new city viewport.

Implementation steps

1) Change `handleBoundsChange` to never block updating `mapBounds`
File: `src/components/map-search/MapSearchLayout.tsx`
- Current behavior:
  - If `isProgrammaticMoveRef.current` is true, it returns early and updates nothing.
- New behavior:
  - Always update `setMapBounds(bounds)` (so queries have correct viewport).
  - While programmatic move is active, skip only `setMapCenter`/`setMapZoom` (to avoid the “overwrite destination mid-flight” problem).
- Pseudocode:
  - `setMapBounds(bounds);`
  - `if (isProgrammaticMoveRef.current) return;`
  - `setMapCenter(center); setMapZoom(zoom);`

Why this matters:
- Even if center/zoom are “protected” during the flight, we still need bounds to update at the end so listings refresh.

2) Force a “final bounds sync” at the end of the flyTo animation
File: `src/components/map-search/PropertyMap.tsx`
- Problem: the last `moveend` occurs while `isProgrammaticMoveRef` is still true, so the last bounds update is ignored.
- Solution: In `MapViewUpdater`’s `moveend` handler, after clearing flags, manually compute the final bounds/center/zoom from Leaflet and call `onBoundsChange(...)` directly.
- This guarantees that MapSearchLayout receives a post-animation update even if the normal `MapBoundsListener` update was skipped.
- Implementation details:
  - Update `MapViewUpdater` props to accept `onBoundsChange` (same signature used elsewhere).
  - In `map.once('moveend', ...)`:
    - set `isFlyingRef.current = false`
    - set `isProgrammaticMoveRef.current = false`
    - read `const bounds = map.getBounds(); const center = map.getCenter(); const zoom = map.getZoom();`
    - call `onBoundsChange({north/south/east/west}, [center.lat, center.lng], zoom)`

3) Pass `onBoundsChange` into `MapViewUpdater`
File: `src/components/map-search/PropertyMap.tsx`
- Update the `MapViewUpdater` call site to include `onBoundsChange={...}`.
- This will be a small signature change but keeps the logic local and reliable.

4) Stabilize city-switch UX (optional but recommended while we’re in here)
File: `src/components/map-search/MapSearchLayout.tsx`
When a city changes or is cleared:
- Clear selection and any “stale” constraints that can confuse results:
  - `setSelectedPropertyId(null)` (avoid popup referencing an old property id)
  - If a polygon is drawn, consider clearing it on city change OR at least re-enabling `searchAsMove` + clearing `frozenBounds` so the new city can load normally.
- This is optional; the core bug is bounds not updating. But it prevents “sticky” filters from making it look broken even when the animation works.

5) Verification checklist (we will explicitly test the failing scenarios you described)
After implementation, we’ll verify these exact flows:
A. City-to-city switch with prior panning
- Start on City A, pan/zoom a bit, then switch to City B.
- Expected:
  - map animates (flyTo) from current position to City B
  - after animation completes, listings refresh to City B (not “No properties in this area”)
  - markers correspond to City B

B. Far city switch (e.g., “Oshawa” → “Be’er Sheva”)
- Expected:
  - map visibly flies across Israel (duration ~1.5s)
  - listings and markers change to Be’er Sheva after the flight

C. Buy and Rent modes
- Repeat A/B with `status=for_sale` and `status=for_rent`
- Expected: both modes refresh correctly (bounds + city filter consistent)

D. Regression checks
- Manual pan/zoom still updates listings when `searchAsMove` is active
- City cleared still zooms out to Israel and shows appropriate national results

Technical notes (why this will work)
- The core issue is that `mapBounds` is a critical input to `usePaginatedProperties`, and we were preventing it from updating during programmatic moves.
- By (1) always updating bounds and (2) forcing a “final bounds sync” after the fly completes, we guarantee queryFilters changes to match the new viewport, which triggers the property query to fetch the correct dataset for the new city.

Files to change
- `src/components/map-search/MapSearchLayout.tsx`
  - Adjust `handleBoundsChange` logic as described
  - (Optional) clear selection/polygon/frozenBounds on city change
- `src/components/map-search/PropertyMap.tsx`
  - Extend `MapViewUpdater` to accept `onBoundsChange`
  - On moveend: clear flags and push final bounds/center/zoom via `onBoundsChange`

Expected result
- City switches always “guide” (smooth animation) AND reliably show the new city’s properties on the list and map immediately after the animation completes, even if the user panned/zoomed beforehand.
