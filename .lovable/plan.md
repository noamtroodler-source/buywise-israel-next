

# Declutter Map Markers: Smaller Pills at Low Zoom + Collision Avoidance

## Problem
At zoom 10-12, full-size price pills overlap and create a messy, glitchy experience. Since the query already limits to 24 properties per page, the issue isn't quantity -- it's that the pills are too large for the zoom level and stack on identical/nearby coordinates.

## Solution: Two-Tier Pill Sizing + Hover-to-Expand

At zoom 10-12 ("compact mode"), show **smaller, condensed pills** that take less space. On hover, the pill smoothly expands to full size. At zoom 13+, pills stay full-size as they are now.

### Zoom Behavior

```text
Zoom Level   | Pill Style
-------------|--------------------------------------
<= 9         | City waypoints (unchanged)
10-12        | Compact pills: smaller font (10px), tighter padding, no indicator dots
13+          | Full pills: current size (12px), with hot/drop indicators
```

### What Changes

**1. MarkerClusterLayer.tsx**
- Pass a `compact` boolean prop to PropertyMarker and ProjectMarker based on zoom level
- `compact = zoom <= 12`

**2. PropertyMarker.tsx**
- Accept `compact` prop
- When compact: use smaller `createCompactMarkerHtml` (just price, no indicator, smaller font/padding)
- When compact: use smaller `estimateCompactPillWidth` 
- The hover CSS will scale compact pills up slightly for readability
- Add `compact` to memo comparison

**3. ProjectMarker.tsx**
- Accept `compact` prop  
- When compact: hide the building SVG icon, show only the price in smaller text
- Smaller pill dimensions

**4. src/index.css**
- Add `.property-marker-pill.compact` styles:
  - font-size: 10px
  - padding: 2px 6px
  - border-width: 1px (thinner)
  - box-shadow: lighter
- On hover of `.compact`, scale to 1.15 (slightly more than normal) so they pop out clearly
- Transition stays smooth (already 150ms)

### Technical Details

**Compact pill HTML** (PropertyMarker):
```text
<div class="property-marker-pill compact">$1.2M</div>
```
No indicator span. Just the price.

**Compact pill HTML** (ProjectMarker):
```text
<div class="property-marker-pill project-marker-pill compact">From $1.2M</div>
```
No building SVG icon. Just text.

**Size comparison**:
- Full pill: ~12px font, 4px 10px padding, ~80px wide
- Compact pill: ~10px font, 2px 6px padding, ~55px wide (30% smaller footprint)

**Files to modify**:
1. `src/components/map-search/MarkerClusterLayer.tsx` -- pass `compact` prop based on zoom
2. `src/components/map-search/PropertyMarker.tsx` -- accept and use `compact` prop
3. `src/components/map-search/ProjectMarker.tsx` -- accept and use `compact` prop
4. `src/index.css` -- add `.compact` pill styles

