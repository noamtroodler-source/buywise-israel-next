

# Standardize Map Layer Popup Cards to BuyWise Brand

## Problem
All 5 InfoWindow popup cards (POI, Train Stations, Saved Places, City Anchors, GoogleMiniMap) use raw unstyled HTML inside Google's default InfoWindow bubble. They have inconsistent padding, no brand colors, hardcoded gray text colors, and no visual hierarchy matching the platform's design system.

## Design Standards to Apply
- **Font**: Inter (already loaded globally, but InfoWindows render in a Google iframe — need inline styles)
- **Colors**: Use brand primary (`#0472E6`) for links/CTAs, neutral grays from the design system
- **Typography**: Consistent sizing — name as `font-semibold`, Hebrew name as secondary, metadata as muted
- **English Level badge**: Use brand-consistent pill with proper spacing
- **Links**: Styled with primary blue, not default browser link color
- **Layout**: Consistent `max-w-[240px]`, `p-2` padding, `space-y-1` vertical rhythm across all cards
- **Category icon**: Show a small colored dot or category label at the top for POIs
- **"International buyers"**: Replace any "Anglo" text in description content (brand voice standard)

## Changes

### 1. Create shared `MapInfoCard` component
**New file: `src/components/map-search/MapInfoCard.tsx`**

A reusable wrapper that provides consistent styling for all InfoWindow content:
- Consistent padding (`p-2`), max-width (`max-w-[240px]`)
- Font family forced to Inter via inline style (Google InfoWindow iframe)
- Title row: name (semibold) + optional Hebrew name below
- Optional subtitle slot (subcategory, denomination)
- Optional badge slot (english level)
- Optional description (truncated)
- Optional address line
- Optional action links row (phone, website)

### 2. Update `POILayer.tsx` InfoWindow content
Replace inline markup with `MapInfoCard`, passing all fields as props. The card will handle layout and styling consistently.

### 3. Update `TrainStationLayer.tsx` InfoWindow content
Use `MapInfoCard` with name + Hebrew name. Add a small train icon or "Train Station" subtitle for context.

### 4. Update `SavedPlacesLayer.tsx` InfoWindow content
Use `MapInfoCard` with label + address.

### 5. Update `CityAnchorsLayer.tsx` InfoWindow content
Use `MapInfoCard` with name, Hebrew name, description.

### 6. Update `GoogleMiniMap.tsx` InfoWindow content
Use `MapInfoCard` with name + category subtitle.

All popup cards will share identical visual treatment — clean, branded, consistent with the platform's "warm professional" voice.

