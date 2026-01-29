
# Enable Infinite/Circular Looping on Mobile Carousels

## Overview
Enable circular scrolling on the homepage mobile carousels so users can swipe in either direction infinitely. From the first property, swiping left will jump to the last property, and from the last property, swiping right will return to the first.

## Current State
Both `FeaturedShowcase.tsx` and `ProjectsHighlight.tsx` have their Embla carousel configured with:
```typescript
loop: false
```

This prevents scrolling past the first or last item.

## Change Required

### FeaturedShowcase.tsx (Line 21)
Change the Embla carousel configuration:
```typescript
// Before
loop: false,

// After
loop: true,
```

### ProjectsHighlight.tsx (Line 32)
Same change:
```typescript
// Before
loop: false,

// After
loop: true,
```

## Behavior After Change
- **First slide**: Swiping left (or tapping left arrow) goes to the last slide
- **Last slide**: Swiping right (or tapping right arrow) goes to the first slide
- Dot indicators will update correctly as the carousel loops
- This matches the platform's existing pattern for the FullscreenGallery which already uses infinite/circular looping

## Files to Modify
| File | Change |
|------|--------|
| `src/components/home/FeaturedShowcase.tsx` | Line 21: `loop: false` → `loop: true` |
| `src/components/home/ProjectsHighlight.tsx` | Line 32: `loop: false` → `loop: true` |

## Expected Outcome
Users can freely swipe through all properties in either direction, creating a more natural browsing experience that matches Zillow's carousel behavior where you can scroll endlessly in both directions.
