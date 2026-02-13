

# Integrating New Development Projects into Map Search

## Overview
Show projects (new developments) alongside regular property listings on the map, so buyers exploring the "Buy" view naturally discover new builds in their area. Projects are visually distinct but not overpowering — they feel like a natural part of the same search experience.

## How It Works for Users

**On the map:**
- Project markers appear as price pills showing "From X" (e.g., "From ₪3.2M") with a small building icon prefix to subtly differentiate them from resale listings
- Same color scheme as regular markers — no jarring contrast
- Clicking a project marker shows a popup card with project-specific info (name, price range, available units, completion date)

**In the side list:**
- Project cards mix in with property cards, sorted together by the current sort order
- A small "New Development" label replaces the property type line (e.g., instead of "Apartment" it says "New Development")
- Price shows as "From ₪X" range format instead of a fixed price
- Stats show available units and completion date instead of beds/baths/sqm
- Links to `/projects/{slug}` instead of `/property/{id}`

**Filtering:**
- The existing Buy/Rent toggle gets a third option: "Buy | Rent | New" — or alternatively, a checkbox/chip "Include New Projects" that layers them on top of Buy results
- When "Projects" is the active status (already supported via `?status=projects`), only projects are shown
- Price filters apply to `price_from` for projects

## Technical Approach

### 1. Fetch Projects Alongside Properties
Create a `usePaginatedProjects` hook (or extend `usePaginatedProperties`) that queries the `projects` table with the same bounds-based spatial filtering. Key mappings:
- `price_from` / `price_to` for price filters
- `latitude` / `longitude` for bounds
- `is_published = true`

### 2. Unified Item Type
Create a discriminated union type:
```text
type MapItem = 
  | { type: 'property'; data: Property }
  | { type: 'project'; data: Project }
```
Both marker layers and list panels will render based on `item.type`.

### 3. Map Markers (PropertyMarker + MarkerClusterLayer)
- Add a `ProjectMarker` component (similar to `PropertyMarker`) that renders "From ₪X" pills with a subtle building icon
- Feed both property and project GeoJSON points into the same `useSupercluster` instance so they cluster together naturally
- Projects use the same dot/pill display mode transitions based on zoom

### 4. List Cards
- Create a `MapProjectCard` component (sibling to `MapListCard`) with:
  - Same card structure (image carousel, info section)
  - "New Development" badge (using the existing emerald green badge style)
  - "From ₪X – ₪Y" price range
  - "X units available | Est. completion YYYY" stats line
  - Links to `/projects/{slug}`
- `MapListPanel` renders either `MapListCard` or `MapProjectCard` based on item type

### 5. Map Popup Overlay
- Create a `MapProjectOverlay` (or make `MapPropertyOverlay` polymorphic) to show project-specific details when clicking a project marker

### 6. Filter Bar Integration
- Extend the Buy/Rent toggle to support a third "Projects" state, or add a separate "New Projects" chip
- The `?status=projects` URL param already exists — when active, skip the properties query and only fetch projects
- When status is `for_sale`, fetch both properties AND projects (projects are always "for sale")

### 7. Sorting
- Projects map to the same sort keys: `created_at` for newest, `price_from` for price sorts
- Client-side interleaving of two sorted arrays, or a single merged + re-sorted array

## Files to Create/Modify

| File | Change |
|------|--------|
| `src/hooks/usePaginatedProjects.tsx` | New hook for fetching projects with bounds/filters |
| `src/components/map-search/MapProjectCard.tsx` | New list card for projects |
| `src/components/map-search/ProjectMarker.tsx` | New marker component for projects |
| `src/components/map-search/MapSearchLayout.tsx` | Merge project + property data, pass unified items |
| `src/components/map-search/MapListPanel.tsx` | Render both card types |
| `src/components/map-search/MarkerClusterLayer.tsx` | Accept and render both marker types |
| `src/components/map-search/PropertyMap.tsx` | Pass projects through to cluster layer |
| `src/components/map-search/MapPropertyOverlay.tsx` | Handle project click popups (or new overlay) |
| `src/components/filters/PropertyFilters.tsx` | Add Projects option to Buy/Rent toggle |
| `src/components/map-search/MobileMapSheet.tsx` | Render both card types on mobile |
| `src/components/map-search/MobileCardCarousel.tsx` | Support project cards in mobile carousel |

## Edge Cases to Handle
- Projects without coordinates (skip markers, still show in list if within city bounds — though all 76 current projects have coords)
- Price range display when `price_from` is null (show "Contact for pricing")
- Sorting interleaving (newest first mixes properties and projects by `created_at`)
- Cluster counts include both types (this happens automatically with supercluster)
- Favorite button on projects uses `useProjectFavorites` hook (already exists) instead of `FavoriteButton`

