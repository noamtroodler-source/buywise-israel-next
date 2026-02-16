

# Save Search Alert from Map Toolbar

## What Changes

A bell icon button gets added to the map toolbar (the vertical button stack on the right side of the map). Clicking it opens the existing `CreateAlertDialog`, pre-filled with the current map filters and listing type. This captures the user's current search context so they can get notified when new matches appear.

## Where It Goes

In the **Tools group** of the `MapToolbar`, between the Draw and Share buttons. The bell icon matches the existing 8x8 button style.

## How It Works

1. User sets filters, pans/zooms the map to their area of interest
2. Clicks the bell icon in the toolbar
3. The existing `CreateAlertDialog` opens with current filters + listing type pre-filled
4. User picks frequency (instant/daily/weekly), notification method, and confirms
5. Alert is saved to the `search_alerts` table

No new components or database changes needed -- this wires existing pieces together.

## Files to Modify

### 1. `src/components/map-search/MapToolbar.tsx`
- Add `onCreateAlert` callback prop
- Add a `Bell` icon button in the Tools group (between Draw and Share)
- Clicking it calls `onCreateAlert()`

### 2. `src/components/map-search/MapSearchLayout.tsx`
- Add `showAlertDialog` state
- Import and render `CreateAlertDialog`, passing current `componentFilters` and `listingType`
- Pass `onCreateAlert` callback to `MapToolbar` (via `PropertyMap`)

### 3. `src/components/map-search/PropertyMap.tsx`
- Thread the `onCreateAlert` prop through to `MapToolbar`

## Technical Details

- The `CreateAlertDialog` already handles auth gating (shows "sign in" message if not logged in)
- Filters are passed as `PropertyFilters` which the dialog already knows how to summarize
- Listing type maps directly: `urlFilters.status` as `ListingType`
- No new dependencies, no database changes, no edge functions

