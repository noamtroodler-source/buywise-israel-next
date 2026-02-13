

# Phase 1: Core Layout Shell + Working Leaflet Map

This phase establishes the foundation -- a full-screen 60/40 split layout with a live interactive Leaflet map on the left and a placeholder list panel on the right. No markers, no filters, no cards yet -- just the rock-solid structural shell that everything else will be built on top of.

## What Gets Built

1. **MapSearch page** -- Rewired to use `hideFooter` and `hideMobileNav` for a full-screen immersive experience, with dynamic SEO titles based on URL params (`status`, `city`)
2. **MapSearchLayout** -- The main orchestrator component with a CSS grid 60/40 split (desktop) and full-screen map (mobile)
3. **PropertyMap** -- The Leaflet map container with CartoDB light tiles, zoom controls, locate-me button, and proper z-index management
4. **MapListPanel** -- The right-side placeholder panel with a header showing "0 results" and a sort dropdown skeleton, ready for Phase 2 cards
5. **useMapFilters hook** -- Reads URL search params (`status`, `city`, `bounds`) into a typed `PropertyFilters` object and writes changes back to the URL for shareable links

## Layout Architecture

```text
+------------------------------------------------------------------+
|  Header (sticky, z-50)                                            |
+------------------------------------------------------------------+
|  Filter Bar placeholder (48px, border-bottom)                     |
+-------------------------------+----------------------------------+
|                               |                                  |
|    Leaflet Map (60%)          |   List Panel (40%)               |
|                               |   - Results header               |
|    - CartoDB light tiles      |   - 2-col card grid (empty)      |
|    - Zoom +/- (bottom-right)  |   - "No results" placeholder     |
|    - Locate me (bottom-right) |                                  |
|    - Israel default center    |                                  |
|                               |                                  |
+-------------------------------+----------------------------------+
```

On mobile (below `lg` breakpoint), the map fills the full screen and the list panel is hidden (Phase 6 will add the bottom sheet).

## Files Created

### 1. `src/pages/MapSearch.tsx` (rewrite)
- Restore `hideFooter` and `hideMobileNav` on Layout for immersive mode
- Read `status` and `city` from URL params for dynamic SEO title
- Lazy-load `MapSearchLayout`

### 2. `src/components/map-search/MapSearchLayout.tsx`
- CSS grid layout: `grid-cols-[3fr_2fr]` on `lg+`, full-width map on mobile
- Renders the filter bar placeholder (a 48px div with border), PropertyMap, and MapListPanel
- Full viewport height minus header: `h-[calc(100vh-64px)]`

### 3. `src/components/map-search/PropertyMap.tsx`
- `MapContainer` from react-leaflet, centered on Israel (31.5, 34.8), zoom 8
- CartoDB Positron light tiles (clean, Zillow-like)
- Custom zoom controls (+ / - buttons) positioned bottom-right in a frosted-glass card
- "Locate me" geolocation button below zoom controls
- Fires `onBoundsChange` callback when the user pans/zooms (for future filter integration)
- Proper z-index (40 for controls, map pane default)

### 4. `src/components/map-search/MapListPanel.tsx`
- Scrollable right panel with:
  - Header row: "X results" (bold) + sort dropdown (ghost button, disabled for now)
  - Empty state: centered message "Move the map or adjust filters to find properties"
- Ready to receive cards in Phase 2

### 5. `src/hooks/useMapFilters.ts`
- Reads `status`, `city`, `min_price`, `max_price`, `min_rooms`, `max_rooms`, `property_type`, `sort_by` from URL search params
- Returns a typed `PropertyFilters` object + setter functions that update the URL
- Provides `listingType` derived from status param (`for_sale` | `for_rent` | `projects`)

## Technical Details

- **No new dependencies** -- uses existing `react-leaflet`, `leaflet`, `lucide-react`
- **Tile provider**: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png` (CartoDB Positron -- cleaner than OSM default, matches Zillow aesthetic)
- **Israel center**: `[31.5, 34.8]` zoom 8 shows the full country
- **Height calc**: `calc(100vh - 64px)` accounts for the 64px (h-16) sticky header
- **Mobile**: Map fills entire area; list panel hidden with `hidden lg:block`
- **Filter bar**: Just a styled div placeholder with text "Filters coming in Phase 4" -- keeps the vertical space reserved so the layout doesn't shift later

