

# Add Loading Indicators for Map Data

## What Changes

Two loading indicators will be added to give users feedback when panning/zooming to a new area:

1. **Map overlay spinner** -- A small, subtle loading pill/spinner overlaid on the map (top-center, below the filter bar) that appears when `isFetching` is true and `isLoading` is false (i.e., background refetch after pan/zoom, not initial load). It will say "Loading..." with a small spinner icon and have a semi-transparent background so the map stays visible beneath it.

2. **Mobile bottom sheet indicator** -- The `MobileMapSheet` currently has no fetching indicator (unlike the desktop `MapListPanel` which has a `Progress` bar). A matching thin progress bar will be added at the top of the sheet content.

## Technical Details

### 1. New component: `MapLoadingIndicator`
**File: `src/components/map-search/MapLoadingIndicator.tsx`** (new)

A small floating pill positioned at the top-center of the map container:
- Shows only when `isFetching && !isLoading`
- Contains a `Loader2` spinner icon + "Updating..." text
- Semi-transparent `bg-background/80 backdrop-blur-sm` styling
- Fades in/out with a CSS transition or framer-motion `AnimatePresence`
- `pointer-events-none` so it doesn't block map interaction

### 2. Wire it into `PropertyMap`
**File: `src/components/map-search/PropertyMap.tsx`**

- Add `isFetching` and `isLoading` props to `PropertyMapProps`
- Render `<MapLoadingIndicator />` inside the map container div

### 3. Pass props from layout
**File: `src/components/map-search/MapSearchLayout.tsx`**

- Pass `isFetching={isFetching}` and `isLoading={isLoading}` to `<PropertyMap />`

### 4. Mobile sheet progress bar
**File: `src/components/map-search/MobileMapSheet.tsx`**

- Add `isFetching` prop
- Render a thin `<Progress />` bar (same as desktop `MapListPanel`) at the top of the sheet when fetching

### Files Summary

| File | Change |
|------|--------|
| `src/components/map-search/MapLoadingIndicator.tsx` | New -- floating "Updating..." pill |
| `src/components/map-search/PropertyMap.tsx` | Add `isFetching`/`isLoading` props, render indicator |
| `src/components/map-search/MapSearchLayout.tsx` | Pass `isFetching`/`isLoading` to `PropertyMap` |
| `src/components/map-search/MobileMapSheet.tsx` | Add `isFetching` prop, render progress bar |

