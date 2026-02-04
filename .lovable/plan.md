

## Fix Map Controls Appearing Above Navigation Dropdowns

### The Problem

The map toolbar and related controls are using `z-[1000]` (z-index: 1000), while navigation dropdowns use the Radix UI standard of `z-50` (z-index: 50). This means the map controls are rendering on top of navigation menus instead of behind them.

### The Solution

Lower the map-specific z-index values to be below the header/navigation layer but still above the map itself. The correct hierarchy should be:

| Layer | z-index | Components |
|-------|---------|------------|
| Modals/Dialogs | 50 | Alert dialogs, Dialogs, Sheets |
| Navigation dropdowns | 50 | Header dropdowns (Buy, Rent, Learn, etc.) |
| **Map controls** | **40** | MapToolbar, ClearDrawingButton |
| Leaflet native controls | 40 | Zoom controls (already correct in CSS) |
| Map content | auto | Markers, popups |

---

### Files to Change

#### 1. `src/components/map-search/MapToolbar.tsx`

Change the container's z-index from `z-[1000]` to `z-[40]`:

```tsx
// Line 144: Change z-[1000] to z-[40]
<div 
  className="absolute top-4 right-4 z-[40] flex flex-col gap-1.5"
  role="toolbar"
  ...
>
```

#### 2. `src/components/map-search/ClearDrawingButton.tsx`

Change the container's z-index from `z-[1000]` to `z-[40]`:

```tsx
// Line 19: Change z-[1000] to z-[40]
className="absolute top-4 left-1/2 -translate-x-1/2 z-[40]"
```

#### 3. `src/index.css` (property marker hover state)

The CSS has a property marker style with `z-index: 1000 !important` for hovered/selected markers. This should also be lowered:

```css
/* Line 283: Change from z-index: 1000 to a lower value */
.property-marker.hovered,
.property-marker.selected {
  transform: scale(1.15);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
  border-color: white;
  z-index: 100 !important; /* Was 1000, lowered to stay above other markers but below dropdowns */
}
```

---

### Why z-40?

- Radix UI dropdowns use `z-50` by default
- The existing CSS already forces Leaflet controls to `z-index: 40`
- Using `z-40` keeps map controls consistent and ensures all navigation/header elements (z-50) appear above them

---

### Result

After this fix:
- Header navigation dropdowns (Buy, Rent, Learn, Company) will appear above map controls
- Map toolbar buttons (zoom, locate, draw, share) stay above the map tiles
- Modals and dialogs continue to work correctly (z-50)
- Property markers on hover/select still pop above other markers but don't interfere with UI

