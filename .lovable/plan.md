

## City Overlay Redesign - Clean, Professional Map Markers

### Current Issues

1. **Visual Overlap**: Tel Aviv metro area has 8+ cities clustered together (Herzliya, Hod HaSharon, Kfar Saba, Ra'anana, Petah Tikva, Ramat Gan, Tel Aviv) causing unreadable marker overlap
2. **Disjointed Design**: The current "city name pill + separate blue count bubble" looks unprofessional and disconnected
3. **No Prioritization**: All cities shown equally regardless of property count or importance

### Solution: Unified City Pill Markers

Redesign to a single, unified marker style similar to how Zillow and Redfin show regional markers:

**New Design**:
- Single cohesive pill: `City Name • Count` (e.g., "Jerusalem • 16")
- Clean white background with subtle border and shadow
- Blue text for city name, muted for count
- Hover state with subtle lift effect
- Size scales based on property count (larger cities = slightly larger markers)

### Implementation

**1. Update CityOverlay Component**
- Change marker HTML to single unified pill design
- Add size tiers based on property count (similar to cluster markers)
- Update iconAnchor to center markers properly

**2. Add Smart Collision Handling**
For the Tel Aviv metro cluster, implement one of two approaches:

*Option A (Recommended)*: Regional grouping at very zoomed out levels
- When zoom is less than 8, group Tel Aviv metro cities into a single "Gush Dan • 112" marker
- Clicking expands to show individual cities as user zooms in
- This prevents the visual mess in the screenshot

*Option B*: CSS-based offset
- Apply slight position offsets to overlapping markers
- Less elegant but simpler

**3. Update CSS Styles**
- Replace the two-element styling with unified pill styling
- Add hover and interaction states
- Implement size tiers (small/medium/large based on property count)

### Technical Details

**CityOverlay.tsx Changes**:
```tsx
// New unified pill HTML
html: `
  <div class="city-marker-pill ${sizeTier}">
    <span class="city-label">${name}</span>
    <span class="city-divider">•</span>
    <span class="city-count">${count}</span>
  </div>
`
```

**CSS Changes**:
```css
.city-marker-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: white;
  border-radius: 9999px;
  border: 1px solid hsl(220, 13%, 85%);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
  cursor: pointer;
  white-space: nowrap;
  transform: translate(-50%, -50%);
}

.city-marker-pill .city-label {
  font-weight: 600;
  font-size: 13px;
  color: hsl(213, 94%, 40%);
}

.city-marker-pill .city-count {
  font-size: 12px;
  color: hsl(220, 10%, 50%);
}
```

### Size Tiers
- **Small** (1-20 properties): Compact pill
- **Medium** (21-50 properties): Standard pill  
- **Large** (50+ properties): Slightly larger, bolder

### Files to Modify
1. `src/components/map-search/CityOverlay.tsx` - Update marker rendering with new unified design
2. `src/index.css` - Replace city overlay styles with new unified pill design

### Result
- Clean, professional city markers that match modern map design standards
- Single cohesive element instead of disjointed name + bubble
- Proper sizing hierarchy based on property count
- Better visual separation through unified design

