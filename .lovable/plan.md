
## Make Project Markers Smaller and Simpler

Based on the screenshot, you want the project markers to be more compact with just:
- Blue house icon
- **Bold project name**
- Dot separator
- "From ₪X.XM" price

### Changes Required

#### File: `src/components/map-search/ProjectMarker.tsx`

Simplify the marker HTML structure:

```tsx
// Current structure (too complex):
<div class="project-marker-pill">
  <svg>...</svg>
  <span class="project-marker-name">${project.name}</span>
  ${displayPrice ? `<span class="project-marker-divider">•</span><span class="project-marker-price">${displayPrice}</span>` : ''}
</div>
<div class="project-marker-pointer"></div>

// New structure (simpler, smaller):
<div class="project-marker-pill">
  <svg>...</svg>
  <span class="project-marker-name">${project.name}</span>
  ${displayPrice ? `<span class="project-marker-divider">•</span><span class="project-marker-price">${displayPrice}</span>` : ''}
</div>
// Remove pointer for cleaner look
```

#### File: `src/index.css`

Make the marker smaller and cleaner:

```css
.project-marker-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;       /* Reduced from 6px 10px */
  background: white;
  border-radius: 6px;
  font-size: 11px;
  white-space: nowrap;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  border: 1px solid hsl(220 10% 85%);
  cursor: pointer;
  transition: all 200ms ease;
}

.project-marker-icon {
  flex-shrink: 0;
  color: hsl(213 94% 45%);  /* Blue icon */
}

.project-marker-name {
  font-weight: 600;         /* Bold name */
  color: hsl(220 10% 25%);
}

.project-marker-divider {
  opacity: 0.4;
  font-size: 8px;
}

.project-marker-price {
  font-weight: 500;
  color: hsl(220 10% 45%);
  font-size: 10px;
}
```

### Visual Result

**Before:** Larger marker with pointer arrow  
**After:** Compact pill matching the screenshot: `🏠 **Haifa Residence** • From ₪1.8M`

The marker will be:
- Smaller overall footprint
- No bottom pointer (cleaner look)
- Blue house icon on left
- Bold project name
- Subtle separator dot
- "From ₪X.XM" in lighter gray
