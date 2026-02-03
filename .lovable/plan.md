
## Remove City Selection Requirement for Map Page

### What's Happening Now
When you visit `/map`, the app checks if you have a city selected (from URL, localStorage, or database). If not, it shows a "MapEmptyState" screen forcing you to pick a city before you can see the map.

### What We'll Change
Remove this gate entirely. Users will land directly on the map showing all of Israel at a zoomed-out view with city overlay markers. They can then:
- Click on city markers to zoom in
- Use the search/filters to find properties
- Pan and zoom freely without any barrier

---

## Implementation

### 1. Remove Empty State Logic from MapSearchLayout
- Remove the `showEmptyState` computed value
- Remove the `hasSelectedCity` state (no longer needed)
- Remove the `handleCitySelectFromEmptyState` callback
- Remove both mobile and desktop conditional renders that show `MapEmptyState`
- Set default view to show all of Israel (already configured as `ISRAEL_CENTER` and `ISRAEL_ZOOM`)

### 2. Simplify Recent City Hook Usage  
- Keep the `useRecentSearchCity` hook but only use it to auto-center if a recent city exists (optional enhancement)
- Don't block rendering waiting for it

### 3. Clean Up Imports
- Remove `MapEmptyState` import since it won't be used

### 4. Optional: Keep MapEmptyState File
- The file can remain in the codebase in case we want to use it elsewhere (e.g., a dedicated city search page)
- Or we can delete it entirely

---

## Technical Changes

**File: `src/components/map-search/MapSearchLayout.tsx`**

Remove or simplify:
- Line 12: `MapEmptyState` import → remove
- Line 46: `hasSelectedCity` state → remove
- Lines 141-162: useEffect for smart city selection → simplify to just auto-center without blocking
- Lines 164-180: `handleCitySelectFromEmptyState` callback → remove
- Lines 183-191: `showEmptyState` computation → remove
- Lines 366-385: Mobile empty state conditional render → remove
- Lines 503-506: Desktop empty state conditional render → remove

The result is users go straight to the map view showing Israel with city overlays, which can be clicked to zoom into specific areas.

---

## Expected Behavior After Change

1. Visit `/map` → See full Israel map with city markers immediately
2. City markers show property counts (the redesigned pills we just implemented)
3. Click a city marker → Zoom in to that city, see property markers
4. Use filters to narrow down properties
5. No blocking "choose a city" screen
