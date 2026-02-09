

## Improve Map Hover Interaction (Zillow/Redfin Style)

### Problem
Currently, hovering over a map marker causes the property list on the right to auto-scroll to that property, which is jarring. You want a Zillow/Redfin-style experience where hovering a marker shows a popup card directly on the map, and the list stays put.

### Changes

#### 1. Remove auto-scroll on marker hover (`src/components/map-search/MapPropertyList.tsx`)
- Delete the `useEffect` (lines 42-48) that calls `scrollIntoView` when `hoveredPropertyId` changes
- Remove the associated `cardRefs` ref since it's no longer needed
- Remove the `setCardRef` callback
- Keep the visual highlight ring on the list card for the hovered property (existing `ring-2 ring-primary` class stays)

#### 2. Add hover popup on map markers (`src/components/map-search/PropertyMap.tsx`)
- Track a separate `hoveredPopupId` state for the hover popup (distinct from `selectedPropertyId` which is for clicks)
- When a marker is hovered, show a lightweight popup card at that marker's position
- When the marker is unhovered, dismiss the popup
- If a property is clicked (selected), the click popup takes precedence and hover popup is hidden

#### 3. Create a new `MapHoverPopup` component (`src/components/map-search/MapHoverPopup.tsx`)
- A simpler, more compact version of `MapPropertyPopup` designed for hover state
- Shows: property image, price, beds/baths/sqm, address -- similar to Zillow's hover cards and matching BuyWise design language
- No close button needed (dismisses on mouseout)
- Appears directly at the marker position using Leaflet's `Popup` component
- Styled to match BuyWise's card design: rounded corners, card background, clean typography
- Uses existing `useFormatPrice` and `useFormatArea` hooks for consistency
- Includes favorite button and share button matching the reference screenshots

#### 4. Bidirectional hover (list to map) stays the same
- Hovering a card in the list still highlights the marker on the map (no change needed)
- The marker gets the blue/active style as it does today

### Technical Details

| File | Change |
|------|--------|
| `src/components/map-search/MapPropertyList.tsx` | Remove `scrollIntoView` effect and `cardRefs` |
| `src/components/map-search/MapHoverPopup.tsx` | New component -- compact hover popup card |
| `src/components/map-search/PropertyMap.tsx` | Add hover popup rendering using `MapHoverPopup` when `hoveredPropertyId` is set (and no `selectedPropertyId` active) |

### Hover popup design (matching BuyWise + Zillow reference)
- Width: ~280px
- Property photo (16:10 aspect, rounded top)
- Favorite button overlay on image (top-right)
- Price (bold, formatted with currency preference)
- Beds, baths, sqm stats row with icons
- Address line (truncated)
- No "View Details" button (the click popup already has that)
- Smooth fade-in animation
- Positioned above the marker with Leaflet's popup offset

### Interaction flow after changes
- Hover marker on map: Show hover popup on map, highlight card in list (no scroll)
- Leave marker: Dismiss hover popup
- Click marker: Show full click popup (existing `MapPropertyPopup`), dismiss hover popup
- Hover card in list: Highlight marker on map (no popup, keeping it clean)
- Click card in list: Navigate to property detail page (existing behavior via Link)
