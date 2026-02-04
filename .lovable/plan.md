

## Make Project Markers More Subtle

### Current Issue
The project markers are currently too prominent with:
- Bold teal gradient background (`hsl(175 70% 40%)`)
- Larger padding (8px 12px)
- Heavy 2px white border
- Strong shadow

This makes them visually dominate the map over property listings.

### Proposed Design: Subtle but Distinct

Make project markers use a **white/light background** similar to property markers, but with subtle differentiators:

| Aspect | Current (Too Bold) | New (Subtle) |
|--------|-------------------|--------------|
| Background | Teal gradient | White with soft border |
| Text color | White | Dark gray (neutral) |
| Icon | White building | Primary blue building |
| Border | 2px solid white | 1px solid gray |
| Shadow | Heavy (8px) | Light (4px) |
| Visual cue | None | Small "New" tag or blue accent line |

### Implementation

#### File: `src/index.css`

Update the project marker styles:

```css
.project-marker-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  background: white;
  color: hsl(220, 10%, 30%);
  border-radius: 6px;
  font-weight: 500;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  border: 1px solid hsl(220, 10%, 85%);
  cursor: pointer;
  transition: all 200ms ease;
}

.project-marker-pill:hover,
.project-marker-active .project-marker-pill {
  transform: scale(1.05);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.18);
  border-color: hsl(213, 94%, 45%);
}

.project-marker-icon {
  flex-shrink: 0;
  color: hsl(213, 94%, 45%); /* Primary blue for differentiation */
}

.project-marker-name {
  font-weight: 600;
  color: hsl(220, 10%, 25%);
}

.project-marker-divider {
  opacity: 0.4;
  font-size: 8px;
}

.project-marker-price {
  font-weight: 500;
  color: hsl(220, 10%, 45%);
  font-size: 10px;
}

.project-marker-pointer {
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid hsl(220, 10%, 85%);
  margin-top: -1px;
}
```

#### File: `src/components/map-search/ProjectMarker.tsx`

Update the SVG icon to use the CSS color variable:

```tsx
<svg class="project-marker-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
```

---

### Visual Result

**Before:** Bold teal markers that dominate the map  
**After:** Clean white markers with:
- Blue building icon (differentiator)
- Subtle gray border
- On hover: Blue border highlight
- Same "callout" shape as property markers but slightly smaller

This keeps projects **distinguishable** (blue icon + different shape) while maintaining **visual harmony** with property markers.

