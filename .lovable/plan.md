
## Add Share Button on Hover for Map View Properties

### The Problem
In the grid view (`/buy`, `/rent` pages), hovering over a property card shows a share button. However, in the map view (`/map`), property cards don't show the share button on hover:

1. **MapPropertyList (desktop right panel)**: `PropertyCard` is called with `showShareButton={false}`
2. **MapPropertyCard (mobile sheet)**: This custom compact card component has no share button at all

### The Solution
Enable the share button in both places to match the grid view behavior.

---

### Files to Modify

#### 1. `src/components/map-search/MapPropertyList.tsx`

This is a simple one-line change - the `PropertyCard` component already supports `showShareButton`, we just need to enable it:

**Change line 117:**
```tsx
// FROM:
showShareButton={false}

// TO:
showShareButton={true}
```

This enables the hover-to-reveal share button that already exists in `PropertyCard`.

---

#### 2. `src/components/map-search/MapPropertyCard.tsx`

This custom compact card is used in the mobile swipeable sheet. It currently only has a `FavoriteButton`. We need to add a `ShareButton` next to it.

**Add import:**
```tsx
import { ShareButton } from '@/components/property/ShareButton';
```

**Modify the action buttons section (around line 164):**
```tsx
// FROM:
{/* Favorite Button */}
<div className="flex-shrink-0 self-start">
  <FavoriteButton 
    propertyId={property.id} 
    propertyPrice={property.price}
    size="sm"
  />
</div>

// TO:
{/* Action Buttons */}
<div className="flex-shrink-0 self-start flex flex-col gap-1">
  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    <ShareButton 
      propertyId={property.id} 
      propertyTitle={property.title}
      className="h-7 w-7"
    />
  </div>
  <FavoriteButton 
    propertyId={property.id} 
    propertyPrice={property.price}
    size="sm"
  />
</div>
```

---

### Summary of Changes

| File | Change |
|------|--------|
| `MapPropertyList.tsx` | Set `showShareButton={true}` on PropertyCard |
| `MapPropertyCard.tsx` | Add `ShareButton` import and render it with hover visibility |

---

### Result

After this change:
- **Desktop map view (right panel)**: Hovering over a property in the list will show the share button in the top-right of the card image
- **Mobile map view (sheet)**: Hovering/tapping will reveal the share button next to the favorite button
- Tapping the share button opens the dropdown with "Copy Link" and "WhatsApp" options
- Share tracking analytics will work automatically (already built into `ShareButton`)
