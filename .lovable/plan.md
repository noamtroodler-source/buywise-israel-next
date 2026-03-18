

## Problem Diagnosis

The Google Maps API key (`AIzaSyC2kfGY40PGJEI3c45upDKmnDJggG3tPnQ`) is failing -- either expired, billing disabled, or domain-restricted. The screenshots show:
1. "Oops! Something went wrong" (Netanya listing) -- API key loaded but rejected by Google
2. Blank white map (Mevaseret Zion listing) -- same root cause

**Why the fallback doesn't work:** In `PropertyMiniMapWrapper`, the code checks `googleMapsLoaded && !googleMapsError`. The JS API loader script loads fine (no JS error), but the *service* rejects the key at render time. So `isLoaded = true`, `loadError = undefined`, and the code renders `GoogleMiniMap` which shows Google's error page instead of falling back to Leaflet.

This affects: PropertyDetail (resale), ProjectDetail, and any wizard step using `PropertyMiniMapWrapper`.

## Plan

### 1. Make GoogleMiniMap detect runtime API failures and fall back gracefully

In `GoogleMiniMap.tsx`, add an `onLoad` / `onError` callback to the `<GoogleMap>` component. If the map tiles fail to render (auth error), set a local error state and render the fallback UI instead of the broken map.

### 2. Add fallback propagation in PropertyMiniMapWrapper

Update `PropertyMiniMapWrapper` to accept a callback from `GoogleMiniMap` when it detects a runtime failure. When triggered, switch to rendering the Leaflet `PropertyMiniMap` instead.

Concrete approach:
- Add a `hasGoogleError` state in `PropertyMiniMapWrapper`
- Pass an `onError` callback to `GoogleMiniMap`
- `GoogleMiniMap` calls `onError` if the map's `onLoad` doesn't fire within a timeout, or if Google's `authFailure` callback fires
- When `hasGoogleError` is true, render Leaflet fallback

### 3. Hook into Google Maps auth failure callback

Google Maps fires `window.gm_authFailure` when authentication fails. In `GoogleMapsProvider`, set this global callback to update context state, so all consumers know the key is bad.

### Technical Details

**File changes:**

- **`src/components/maps/GoogleMapsProvider.tsx`**: Add `window.gm_authFailure` listener that sets `loadError` in context. This catches API key failures that `useJsApiLoader` misses.

- **`src/components/maps/GoogleMiniMap.tsx`**: Add `onError` prop. Use `<GoogleMap onLoad>` success + a timeout fallback. If `gm_authFailure` fires or map doesn't load within 5s, call `onError`.

- **`src/components/property/PropertyMiniMapWrapper.tsx`**: Add `hasGoogleError` state. When Google fails, render the Leaflet `PropertyMiniMap` instead. This ensures all pages (property, rental, project, wizard) automatically get the fallback since they all use this wrapper.

No changes needed to `PropertyDetail.tsx`, `ProjectDetail.tsx`, or wizard steps -- they all go through the wrapper.

