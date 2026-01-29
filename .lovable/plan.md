
# Add Horizontal Carousel to Explore Local Markets (RegionExplorer)

## Overview
Convert the "Explore Local Markets" section from a 2-column grid with "Show More" expansion on mobile to a **single-item horizontal carousel** matching the pattern used for Properties and New Developments.

## Current State
- **Mobile**: 2x2 grid showing 2 cities, with "Show More" button to reveal additional cities
- **Desktop**: 4-column grid showing all cities in the active region
- Uses `showAllCities` state to toggle between showing 2 vs all cities

## Changes Required

### 1. Add Embla Carousel Import & Setup
```typescript
import useEmblaCarousel from 'embla-carousel-react';
import { CarouselDots } from '@/components/shared/CarouselDots';

const [emblaRef, emblaApi] = useEmblaCarousel({
  align: 'start',
  loop: true,  // Enable infinite scrolling like other carousels
  skipSnaps: false,
  containScroll: 'trimSnaps',
});
```

### 2. Add Carousel State Management
```typescript
const [selectedIndex, setSelectedIndex] = useState(0);

// Track carousel position
const onSelect = useCallback(() => {
  if (!emblaApi) return;
  setSelectedIndex(emblaApi.selectedScrollSnap());
}, [emblaApi]);

// Reset carousel when region changes
useEffect(() => {
  if (emblaApi) {
    emblaApi.scrollTo(0);
    setSelectedIndex(0);
  }
}, [activeRegion, emblaApi]);
```

### 3. Replace Mobile Grid with Carousel
**Before**: 2-column grid with "Show More" button
**After**: Single-item horizontal carousel with dot indicators

```tsx
{/* Mobile: Horizontal Carousel */}
{isMobile && (
  <div className="sm:hidden">
    <div className="overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {cities.map((city) => (
          <div className="flex-[0_0_calc(100%-1.5rem)] min-w-0 pl-4 first:pl-0">
            {/* City card */}
          </div>
        ))}
      </div>
    </div>
    <CarouselDots 
      total={cities.length} 
      current={selectedIndex} 
      onDotClick={scrollTo}
      className="mt-4"
    />
  </div>
)}

{/* Desktop: Keep existing grid */}
{!isMobile && (
  <div className="hidden sm:grid sm:grid-cols-4 gap-3">
    {cities.map(...)}
  </div>
)}
```

### 4. Remove "Show More" Logic
- Remove `showAllCities` state variable
- Remove the "Show More" button section
- Remove the `displayCities` slicing logic (show all cities in carousel)
- Remove `hasMoreCities` check

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/home/RegionExplorer.tsx` | Add Embla carousel for mobile, remove Show More button, keep desktop grid |

## Visual Result

### Mobile (< 768px)
```text
┌─────────────────────────────┐
│  Explore Local Markets      │
│  Market context and...      │
├─────────────────────────────┤
│ [Coastal] [Central] [North] │
├─────────────────────────────┤
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │    Tel Aviv Image       │ │ ← Swipe left/right
│ │                         │ │
│ │  Tel Aviv               │ │
│ │  Explore properties     │ │
│ └─────────────────────────┘ │
│       ● ○ ○ ○               │ ← 4 cities in Coastal
└─────────────────────────────┘
```

### Desktop (unchanged)
```text
┌──────────────────────────────────────────────────────────┐
│  [Coastal] [Central] [North] [South]                      │
├──────────────────────────────────────────────────────────┤
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│ │ Tel Aviv │ │ Herzliya │ │ Netanya  │ │Ramat Gan │      │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Key Implementation Details

1. **Infinite Loop**: `loop: true` allows swiping in either direction endlessly
2. **Reset on Region Change**: When user switches between Coastal/Central/North/South, carousel resets to first city
3. **"Peek" Effect**: Shows a sliver of the next card (`calc(100%-1.5rem)`)
4. **Existing CarouselDots**: Reuse the shared component already created
5. **Preserved Animations**: Keep the framer-motion entrance animations for both mobile and desktop cards
