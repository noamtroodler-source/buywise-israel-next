
## Fix: Transparent Property Popup

**Root Cause**: There's a global CSS rule at line 458 in `src/index.css` that sets `.leaflet-popup-content-wrapper` to `background: transparent !important;`. This overrides the property popup's background because `!important` always wins over a non-`!important` rule, regardless of specificity.

**Fix** (single file change):

**`src/index.css`** -- Two changes:

1. On the `.property-popup .leaflet-popup-content-wrapper` rule (line 1012), add `!important` to the background so it overrides the global transparent rule:
   - `background: hsl(var(--background)) !important;`

2. Also fix the `.property-popup .leaflet-popup-content` width override -- the global rule forces `width: 300px !important` (line 463), which may conflict with the popup's `min-width: 260px`. Add `width: auto !important;` to the property popup content rule.

This is a pure CSS specificity fix -- no component changes needed.
