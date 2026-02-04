
## Redesign Anglo Community Markers to Match Site Branding

### Current State
The Anglo community POI markers currently use:
- Colorful circular backgrounds (purple for synagogues, green for supermarkets, etc.)
- Emoji icons (🕍, 🛒, 🌳, etc.)
- Click-to-show popup for details

### Problem
- The rainbow of colors doesn't fit the site's blue-primary branding
- Emojis look inconsistent across devices
- No hover feedback showing what the spot is before clicking

### Solution
Redesign markers to match the **train station marker** pattern with hover tooltips:

1. **Consistent Blue-Branded Styling**: White background with blue border (like train station markers)
2. **Lucide SVG Icons**: Replace emojis with clean Lucide icons for each category
3. **Hover Tooltip**: Show spot name on hover using react-leaflet's `Tooltip` component

---

### Technical Changes

#### File: `src/components/map-search/AngloCommunityLayer.tsx`

**Changes:**
- Import `Tooltip` from react-leaflet
- Replace emoji-based `createAngloSpotIcon` with SVG Lucide icons
- Add `<Tooltip>` component with `direction="top"` showing the spot name on hover
- Use consistent white background + blue icon styling

```tsx
// New marker structure with Tooltip
<Marker position={[spot.lat, spot.lng]} icon={createAngloSpotIcon(spot.category)}>
  <Tooltip 
    direction="top" 
    offset={[0, -16]}
    className="anglo-spot-tooltip"
  >
    <span className="font-medium text-xs">{spot.name}</span>
  </Tooltip>
  <Popup>...</Popup>
</Marker>
```

**Icon SVG paths by category:**
| Category | Icon |
|----------|------|
| synagogue | Star of David path (custom) |
| supermarket | ShoppingCart |
| community_center | Users |
| park | Trees |
| cafe | Coffee |
| restaurant | UtensilsCrossed |
| school | GraduationCap |
| medical | Stethoscope |
| fitness | Dumbbell |

#### File: `src/index.css`

**Update `.anglo-poi-marker` styles:**
- White background instead of category-colored
- Blue border (matching train station style)
- Rounded rectangle (6px radius) instead of circle
- Blue icon color

**Add `.anglo-spot-tooltip` styles:**
- Match existing tooltip patterns (white bg, subtle shadow)
- Clean, readable text

```css
.anglo-poi-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 6px;
  border: 1.5px solid hsl(213 94% 45%);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  cursor: pointer;
  transition: transform 200ms ease;
}

.anglo-poi-marker svg {
  color: hsl(213 94% 45%);
}

.anglo-spot-tooltip {
  background: white !important;
  border: none !important;
  padding: 4px 8px !important;
  border-radius: 4px !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12) !important;
  white-space: nowrap !important;
  color: hsl(220 10% 25%) !important;
}

.anglo-spot-tooltip::before {
  display: none !important;
}
```

---

### Visual Result

**Before:**
- Colorful circular markers with emojis (🕍 🛒 🌳)
- Click required to see what it is

**After:**
- Clean white rectangles with blue icons (matching train stations)
- Hover shows the name (e.g., "Nitzanim Synagogue", "Osher Ad Raanana")
- Click still opens full popup with details
