

# POI Layer Polish Plan

## Status Check — What's Already Working

- **368 POIs** all geocoded with valid coordinates, zero nulls
- **No duplicates** found in the data
- **RLS** is correctly configured (public SELECT policy, RLS enabled)
- **LayersMenu** has all 5 POI toggles wired correctly
- **POILayer** already filters by bounds and zoom >= 13, handles null coords, shows denomination/english_level badges, and fixes website URLs without `https://`

## What Needs Fixing

### 1. Truncate long descriptions in popups
Some descriptions are up to 301 characters — too long for a compact InfoWindow. I'll add a 120-character truncation with "..." so popups stay tidy.

### 2. Clear selected POI when categories change
If a user deselects a category while a POI popup from that category is open, the InfoWindow will remain visible for a hidden marker. I'll reset `selected` when `activeCategories` changes.

### 3. Add subcategory display in popup
The data has a `subcategory` field (e.g., type of medical facility, type of grocery store) that isn't shown. I'll add it below the category name for more context.

### 4. Performance guard — cap visible POIs
If all 5 layers are toggled at once over a dense area, we could have 100+ markers. I'll add a cap (e.g., 150 markers max per viewport) to keep things responsive, prioritizing POIs closer to center.

## Files to Change

| File | Change |
|------|--------|
| `src/components/map-search/POILayer.tsx` | Truncate descriptions, clear selection on category change, show subcategory, add marker cap |

No database changes needed.

