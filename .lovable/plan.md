
# Convert Property Suggestions to Carousel (8 Properties, 4 Visible)

## Changes

### 1. Hook: `src/hooks/useToolPropertySuggestions.ts`
- Change `.limit(4)` to `.limit(8)` to fetch 8 properties instead of 4.

### 2. Component: `src/components/tools/shared/ToolPropertySuggestions.tsx`
- Replace the static grid with an Embla carousel (same pattern used in `CityFeaturedProperties` and `SimilarProperties`).
- Show 4 cards at a time on desktop, 2 on tablet, 1 on mobile.
- Add left/right chevron navigation buttons (matching the existing carousel style with outline icon buttons).
- Keep the header with title, subtitle, and "See all" link.
- Move nav arrows next to the "See all" link in the header area for a clean layout.
- Update skeleton loading state to match carousel layout.

No changes needed to the 4 calculator files -- they already use `ToolPropertySuggestions` and will automatically benefit from the updated component.
