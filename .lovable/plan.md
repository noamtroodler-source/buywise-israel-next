
# Map Marker Visual Improvements

## Current Issues Identified

Based on the screenshot and code review:

1. **Hover state not clear enough**: When hovering on a property card in the sidebar, the corresponding marker on the map doesn't stand out enough from other markers. All markers are blue, making it hard to spot which one is highlighted.

2. **Price text cutoff**: The current pill-shaped markers (`rounded-full`) cause the price text to get clipped or blend with the map background because they're too compact.

3. **Clusters also have readability issues**: The cluster markers (circles showing "2" with price range) have text that can be hard to read against the map.

---

## Design Solution

### Change 1: Neutral Default State, Blue on Hover/Select

Transform the marker visual hierarchy:

| State | Current | New |
|-------|---------|-----|
| Default (inactive) | Blue pill | White background, gray text, subtle border |
| Hovered | Blue + slight scale | Blue background, white text, larger scale |
| Selected | Blue + ring | Blue background, white text, ring |

This creates a clear visual distinction - the hovered marker "pops" against all the muted markers.

### Change 2: Better Marker Shape with Pointer

Replace the simple `rounded-full` pill with a more map-appropriate shape:

```
Current: ┌──────┐ (rounded pill)
         │₪3.2M │
         └──────┘

New:     ┌──────┐ (rounded rectangle with pointer triangle)
         │₪3.2M │
         └──┬───┘
            ▼
```

This "callout" shape:
- Provides more room for the price text
- Points precisely to the property location
- Is the industry standard (Google Maps, Airbnb, Zillow)

---

## Technical Implementation

### File: `src/components/map-search/PropertyMarker.tsx`

Update the marker styles to use neutral default colors:

```tsx
// Default state - neutral
let bgColor = 'white';
let textColor = 'hsl(220, 10%, 40%)'; // Gray text
let borderColor = 'hsl(220, 13%, 85%)'; // Subtle gray border

// Hover or selected state - primary blue
if (isHovered || isSelected) {
  bgColor = 'hsl(213, 94%, 45%)'; // Primary blue
  textColor = 'white';
  borderColor = 'white';
}
```

Update the marker HTML to use a callout shape with pointer:

```tsx
return L.divIcon({
  html: `
    <div 
      class="property-marker-wrapper"
      style="position: relative; display: flex; flex-direction: column; align-items: center;"
    >
      <div 
        class="property-marker-pill"
        style="
          background-color: ${bgColor};
          color: ${textColor};
          border: 2px solid ${borderColor};
          padding: 6px 10px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          ${(isHovered || isSelected) ? 'transform: scale(1.1);' : ''}
        "
      >
        ₪${displayPrice}${suffix}
      </div>
      <div 
        class="property-marker-pointer"
        style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 6px solid ${bgColor};
          margin-top: -1px;
        "
      ></div>
    </div>
  `,
  className: '',
  iconSize: L.point(0, 0),
  iconAnchor: L.point(0, 30), // Anchor at bottom of pointer
});
```

### File: `src/index.css`

Add/update marker styles for consistency:

```css
/* Property markers - neutral default, blue on hover */
.property-marker-wrapper {
  transition: transform 200ms ease;
}

.property-marker-pill {
  transition: all 200ms ease;
}

.property-marker-wrapper.hovered .property-marker-pill,
.property-marker-wrapper.selected .property-marker-pill {
  background: hsl(213 94% 45%);
  color: white;
  border-color: white;
  transform: scale(1.1);
}
```

### File: `src/components/map-search/PropertyMap.tsx`

Update the ClusterMarker styling similarly:

```tsx
// Cluster marker - white background by default for better readability
return L.divIcon({
  html: `
    <div class="cluster-marker ${sizeTier}" style="
      background: white;
      color: hsl(213, 94%, 45%);
      border: 2px solid hsl(220, 13%, 85%);
    ">
      <span class="cluster-count">${count}</span>
      <span class="cluster-price">${priceRange}</span>
    </div>
  `,
  ...
});
```

---

## Visual Comparison

### Before (Current State)
```
Map View:
   [₪3.2M]  [₪4.5M]  [₪2.8M]  ← All blue, hover barely visible
      ●        ●        ●
```

### After (Improved)
```
Map View:
   [₪3.2M]  [₪4.5M]  [₪2.8M]  ← White/gray default
      ▼        ▼        ▼

When hovering property card for 4.5M:
   [₪3.2M]  [₪4.5M]  [₪2.8M]  ← 4.5M turns BLUE, stands out
      ▼       ▼▼▼       ▼
             (larger)
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/map-search/PropertyMarker.tsx` | New color logic (neutral default, blue hover), callout shape with pointer |
| `src/components/map-search/PropertyMap.tsx` | Update ClusterMarker to use white background with blue text |
| `src/index.css` | Update `.cluster-marker` styles for white background, add `.property-marker-wrapper` styles |

---

## Additional Improvements Included

1. **Better shadows**: Slightly stronger drop shadow for depth
2. **Smoother transitions**: CSS transitions for hover states
3. **Pointer anchor adjustment**: Move `iconAnchor` to the bottom of the pointer so marker points exactly at the property location
4. **Consistent border radius**: Change from pill (`rounded-full`) to rounded rectangle (`border-radius: 8px`) for more text room

---

## Result

After implementation:
- Neutral gray/white markers for all properties by default
- Blue highlight clearly visible when hovering on a sidebar card
- Callout shape with pointer shows full price without cutoff
- Cluster markers also more readable with white background
- Professional look matching Zillow/Redfin/Airbnb patterns
