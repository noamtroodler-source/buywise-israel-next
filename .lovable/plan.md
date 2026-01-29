
# Mobile Horizontal Carousel Implementation

## Overview
Convert the homepage property and project sections from vertical grid layouts to **single-item horizontal carousels** on mobile, matching Zillow's mobile homepage pattern where users swipe left/right through listings.

## What Changes

### 1. FeaturedShowcase.tsx (For Sale & For Rent Properties)
**Current mobile behavior:** 4 cards displayed in a vertical single-column grid
**New mobile behavior:** 1 card visible at a time, horizontally scrollable to see all 8

Changes:
- Add Embla carousel for mobile view only
- Keep the existing grid layout for desktop (sm and up)
- Show dot indicators below the carousel to show position (1 of 8)
- Full-width card with proper padding
- Smooth snap-to-card scrolling

### 2. ProjectsHighlight.tsx (New Developments)
**Current mobile behavior:** 3 project cards stacked vertically in bento layout
**New mobile behavior:** 1 project visible at a time, horizontally scrollable

Changes:
- Wrap projects in Embla carousel for mobile only
- Keep the bento grid layout for desktop (lg and up)
- Show all available projects (currently 3-6) in the carousel
- Include dot indicators for position awareness

### 3. Shared Carousel Indicator Component
Create a reusable dot indicator component that shows:
- Current position (highlighted dot)
- Total items (all dots)
- Compact styling that doesn't take much space

## Technical Approach

### Mobile Detection
Use the existing `useIsMobile()` hook to conditionally render:
- **Mobile:** Embla horizontal carousel with single-item basis
- **Desktop:** Existing grid layout

### Carousel Configuration
```typescript
useEmblaCarousel({
  align: 'start',
  loop: false,
  skipSnaps: false,
  containScroll: 'trimSnaps', // Prevents overscroll
})
```

### Card Sizing for Mobile Carousel
- `basis-[calc(100%-2rem)]` - Nearly full width with some peek of next card
- This provides visual affordance that more content exists
- Slight gap between cards for clear separation

### Dot Indicators
Position below the carousel:
```tsx
<div className="flex justify-center gap-1.5 mt-3 md:hidden">
  {items.map((_, index) => (
    <button
      key={index}
      onClick={() => emblaApi?.scrollTo(index)}
      className={cn(
        "w-2 h-2 rounded-full transition-colors",
        index === selectedIndex ? "bg-primary" : "bg-muted-foreground/30"
      )}
    />
  ))}
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/FeaturedShowcase.tsx` | Add conditional Embla carousel for mobile, keep grid for desktop |
| `src/components/home/ProjectsHighlight.tsx` | Add conditional Embla carousel for mobile, keep bento for desktop |

## Visual Result

### Mobile View (< 768px)
```
┌─────────────────────────────┐
│  Properties        For Sale │ For Rent
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    Property Image       │ │ ← Swipe left/right
│ │                         │ │
│ │  $450,000               │ │
│ │  3 bed • 2 bath         │ │
│ │  Tel Aviv, Israel       │ │
│ └─────────────────────────┘ │
│       ● ○ ○ ○ ○ ○ ○ ○       │ ← Position dots
│                             │
│   [ View All Properties ]   │
└─────────────────────────────┘
```

### Desktop View (unchanged)
```
┌─────────────────────────────────────────────────────────┐
│  Properties                          For Sale │ For Rent
├─────────────────────────────────────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐│
│ │Card1│ │Card2│ │Card3│ │Card4│ │Card5│ │Card6│ │Card7││
│ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘ └─────┘│
└─────────────────────────────────────────────────────────┘
```

## Key Implementation Details

1. **Preserve Touch Swipe:** The existing `useTouchSwipe` hook on PropertyCard for image swiping will still work - horizontal carousel scrolling uses different touch handling

2. **Performance:** Only one render approach at a time (carousel OR grid) using conditional rendering, not CSS hiding

3. **Loading States:** Show single skeleton card on mobile instead of 4

4. **"Peek" Effect:** Show a sliver of the next card to indicate scrollability (similar to Zillow)

5. **Accessibility:** Dots are clickable buttons with proper ARIA labels

## Expected Outcome
- Dramatically reduced scroll length on mobile homepage
- Intuitive swipe-to-browse experience matching Zillow's pattern
- Clear visual indicator of how many listings are available
- Preserved desktop experience (no changes to grid layouts)
