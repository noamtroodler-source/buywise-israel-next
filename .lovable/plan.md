

# Mobile Carousel for Recent Nearby Sales

## Overview
Convert the "Recent Nearby Sales" section on property detail pages into a horizontal swipeable carousel on mobile, matching the pattern used on the homepage for properties and projects.

---

## Changes Required

### File: `src/components/property/RecentNearbySales.tsx`

**1. Add imports for carousel functionality:**
- `useEmblaCarousel` from `embla-carousel-react`
- `useIsMobile` hook
- `CarouselDots` component
- React hooks: `useState`, `useCallback`, `useEffect`

**2. Add carousel state management:**
- Initialize `emblaRef` and `emblaApi` with carousel options (`loop: true`, `align: 'start'`)
- Track `selectedIndex` for dot navigation
- Set up `onSelect` callback to sync dots with carousel position

**3. Conditional rendering based on device:**

| Device | Layout |
|--------|--------|
| Mobile | Horizontal carousel with peek effect, swipeable cards, dot indicators |
| Desktop | Keep existing vertical stacked cards (no changes) |

**4. Mobile card styling:**
- Each comp card: `flex-[0_0_calc(100%-1.5rem)]` for peek effect
- Add padding/margin for card separation
- Maintain all existing card content (price, distance, date, comparison badges)

---

## Implementation Details

### Carousel Configuration
```tsx
const [emblaRef, emblaApi] = useEmblaCarousel({
  align: 'start',
  loop: true,
  skipSnaps: false,
  containScroll: 'trimSnaps',
});
```

### Mobile Card Structure
```tsx
{/* Mobile Carousel */}
{isMobile && (
  <div className="overflow-hidden" ref={emblaRef}>
    <div className="flex">
      {comps.map((comp) => (
        <div key={comp.id} className="flex-[0_0_calc(100%-1.5rem)] min-w-0 pl-4 first:pl-0">
          {/* Existing card content */}
        </div>
      ))}
    </div>
  </div>
)}

{/* Desktop - unchanged */}
{!isMobile && (
  <div className="space-y-3">
    {/* Existing vertical layout */}
  </div>
)}
```

### Dot Navigation
```tsx
<CarouselDots 
  total={comps.length} 
  current={selectedIndex} 
  onDotClick={scrollTo}
  className="mt-4"
/>
```

---

## Visual Behavior

- **Swipe Gesture**: Users can swipe left/right through nearby sale cards
- **Peek Effect**: Next card is partially visible (~1.5rem) to indicate more content
- **Infinite Loop**: Carousel loops infinitely for smooth navigation
- **Dot Indicators**: Show current position and allow tap navigation
- **Desktop Unchanged**: Vertical stacked list remains for larger screens

---

## Summary

| Aspect | Details |
|--------|---------|
| Files Modified | `src/components/property/RecentNearbySales.tsx` |
| Pattern Used | Same as homepage `FeaturedShowcase.tsx` |
| Mobile Experience | Horizontal swipeable carousel with dots |
| Desktop Experience | No changes - keeps vertical stack |

