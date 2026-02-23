

# Bidirectional Hover Sync: Scroll-Into-View

## Current State

The hover state is already shared bidirectionally:
- Card hover -> sets `hoveredPropertyId` -> marker gets `isHovered=true` (z-index boost + `marker-hovered` CSS class)
- Marker hover -> sets `hoveredPropertyId` -> card gets `isHovered=true` (border highlight)

What's **missing**: when you hover a map marker, the corresponding list card should **scroll into view** automatically.

## Changes

### 1. MapListPanel.tsx -- Add scroll-into-view on marker hover

- Create a `Map<string, HTMLDivElement>` ref to store references to each card's DOM element
- When `hoveredPropertyId` changes (from a marker hover), call `scrollIntoView({ behavior: 'smooth', block: 'nearest' })` on the corresponding card element
- Wrap each card in a div with a `ref` callback that registers it in the ref map

### 2. MobileMapSheet.tsx -- Same scroll-into-view logic

Apply the same pattern for the mobile bottom sheet list so marker hover scrolls the mobile card list too.

## Technical Details

### MapListPanel.tsx

Add a ref map and a scroll effect:

```tsx
const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

useEffect(() => {
  if (!hoveredPropertyId) return;
  const el = cardRefs.current.get(hoveredPropertyId);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [hoveredPropertyId]);
```

Wrap each card with a ref callback:

```tsx
<div
  key={property.id}
  ref={(el) => {
    if (el) cardRefs.current.set(property.id, el);
    else cardRefs.current.delete(property.id);
  }}
>
  <MapListCard ... />
</div>
```

Same pattern for `MapProjectCard` items using their `project-{id}` key.

### MobileMapSheet.tsx

Same `cardRefs` + `useEffect` scroll logic applied to the mobile list grid.

## Summary

| File | Change |
|------|--------|
| `src/components/map-search/MapListPanel.tsx` | Add card ref map + scroll-into-view effect |
| `src/components/map-search/MobileMapSheet.tsx` | Same scroll-into-view for mobile |

No new dependencies. No database changes. Desktop-only scroll is ~15 lines of code.

