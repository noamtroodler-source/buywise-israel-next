

# Phase 7: Polish + BuyWise Touches

This phase adds URL persistence for bounds/zoom/polygon, wires up keyboard shortcuts, enhances the badge system with a "New" tier, adds loading skeletons that match card layout, improves the empty state with an illustration, and shows city context in the results header.

## Overview

Most of the foundational work is already done. The badge system in `MapListCard.tsx` already handles "Just Listed", "Just Available", "Price Drop", and "Featured". The keyboard shortcuts hook (`useMapKeyboardShortcuts`) exists but isn't wired up. This phase connects the dots and adds the remaining polish.

## Changes

### 1. Wire keyboard shortcuts in `PropertyMap.tsx`
- Import and call `useMapKeyboardShortcuts` with a ref to the map instance
- Map shortcut handlers to existing callbacks: `handleToggleDraw`, `handleZoomIn/Out`, `handleLocate`, layer toggles (`T` for trains, `H` for heatmap, `S` for saved locations)
- `Escape` clears drawn polygon and deselects active property
- `?` shows a small tooltip/dialog listing all shortcuts (simple `KeyboardShortcutsDialog` component)

### 2. New file: `src/components/map-search/KeyboardShortcutsDialog.tsx`
- A small Dialog triggered by `?` key or a help button in the toolbar
- Lists all shortcuts from `KEYBOARD_SHORTCUTS` constant
- Simple two-column layout: key badge + description
- Closes on Escape or clicking outside

### 3. Expand badge system in `MapListCard.tsx`
- Add a "New" badge tier for properties listed within 14 days (after the 3-day "Just Listed" check)
- Badge priority order: Featured > Price Drop > Just Listed/Just Available (<=3 days) > New (<=14 days)
- Uses a subtle secondary variant for "New" to distinguish from "Just Listed"

### 4. URL persistence for bounds, zoom, and polygon in `useMapFilters.ts`
- Add URL params: `lat`, `lng`, `zoom`, `polygon`
- `lat`/`lng`/`zoom`: Parsed from URL on mount to set initial map center/zoom; updated on map move
- `polygon`: Uses existing `serializePolygon`/`deserializePolygon` from `geometry.ts`
- Expose these in `MapUrlFilters` interface
- `MapSearchLayout` reads initial bounds/zoom from URL and passes to `PropertyMap` as `initialCenter`/`initialZoom` props

### 5. Pass initial center/zoom to `PropertyMap.tsx`
- Accept optional `initialCenter` and `initialZoom` props
- Use them as defaults for `MapContainer` instead of hardcoded `ISRAEL_CENTER`/`DEFAULT_ZOOM`
- Update URL on bounds change via a new `onMapMove` callback passed from layout

### 6. Persist polygon to URL in `MapSearchLayout.tsx`
- When `drawnPolygon` changes, serialize and write to URL via `setFilter('polygon', serialized)`
- On mount, read `polygon` from URL filters, deserialize, and set as initial `drawnPolygon`

### 7. Enhanced empty state in `MapListPanel.tsx`
- Replace the current minimal empty state with a more polished illustration
- Use a Lucide icon composition (Search + MapPin) with a soft background circle
- Add more helpful copy: "No properties found" + "Try zooming out, removing filters, or searching a different area"
- Add a "Clear filters" button that resets all filters

### 8. Loading skeletons that match card layout in `MapListPanel.tsx`
- The existing `CardSkeleton` already matches the card structure (image aspect ratio + text lines)
- Ensure the skeleton count and grid layout match the actual card grid (already 2-col with 6 skeletons)
- No changes needed here -- already implemented correctly

### 9. City context in results header
- In `MapListPanel.tsx`: When a city filter is active, show "Properties in {city}" instead of just "{count} results"
- In `MobileMapSheet.tsx`: Same change for mobile header
- Pass `cityFilter` prop to both components from `MapSearchLayout`

### 10. Add `?` help button to `MapToolbar.tsx`
- Add a small help/keyboard icon button at the bottom of the toolbar
- Only visible on desktop (hidden on mobile since keyboards aren't relevant)
- Triggers the `KeyboardShortcutsDialog`

## Technical Details

- **URL param debouncing**: Map move events fire frequently. The `lat`/`lng`/`zoom` URL updates should be debounced (300ms) to avoid excessive URL changes. Use `replace: true` to avoid polluting browser history.
- **Polygon URL format**: Uses the existing `serializePolygon` which produces `lat,lng;lat,lng;...` format. Max URL length is not a concern for typical drawn polygons (usually < 20 vertices).
- **Keyboard shortcuts**: The hook already handles ignoring events when input/textarea is focused. The `?` shortcut toggles the help dialog open state.
- **Badge "New" variant**: Uses `variant="secondary"` from the existing Badge component to differentiate from the more prominent "Just Listed" badge.
- **No new dependencies required**.

## Files Summary

| File | Action |
|------|--------|
| `src/components/map-search/KeyboardShortcutsDialog.tsx` | Create |
| `src/components/map-search/PropertyMap.tsx` | Modify -- wire keyboard shortcuts, accept initial center/zoom, add onMapMove |
| `src/components/map-search/MapToolbar.tsx` | Modify -- add help button |
| `src/components/map-search/MapListCard.tsx` | Modify -- add "New" badge tier |
| `src/components/map-search/MapListPanel.tsx` | Modify -- city context header, enhanced empty state |
| `src/components/map-search/MobileMapSheet.tsx` | Modify -- city context header |
| `src/components/map-search/MapSearchLayout.tsx` | Modify -- URL persistence for bounds/zoom/polygon, pass city to panels |
| `src/hooks/useMapFilters.ts` | Modify -- add lat/lng/zoom/polygon URL params |

