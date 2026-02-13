

## Upgrade Map Popup to Match List Cards

Rewrite `MapPropertyPopup.tsx` to mirror the patterns already used in `MapListCard.tsx`, bringing feature parity to the popup.

### Changes (single file: `src/components/map-search/MapPropertyPopup.tsx`)

**1. Functional Heart Button**
Replace the decorative `<Heart>` icon with the existing `<FavoriteButton>` component, positioned identically to `MapListCard` (absolute top-right, z-10).

**2. Image Carousel with Dots**
- Add `useState` for `imageIndex` and `useCallback` for `prevImage`/`nextImage`.
- Render `ChevronLeft`/`ChevronRight` arrows on hover (using a local `isHovered` state).
- Render `<CarouselDots>` at the bottom of the image (capped at 5 dots, same as `MapListCard`).
- Cycle through `property.images` array; fall back to a single-image array if empty.

**3. Status Badges**
- Extract the `getStatusBadge()` function from `MapListCard` into a shared utility or simply copy it into the popup (it's small -- ~20 lines).
- Render the badge in the top-left of the image area, matching `MapListCard`'s styling (emerald for "New", destructive for "Price Drop", etc.).

**4. Price per sqm Subtitle**
- Compute `pricePerSqm = property.price / property.size_sqm` when `size_sqm` exists.
- Display it as a secondary line below the price, formatted with `useFormatPrice` and appended with `/sqm` (or the area unit from preferences).

**5. Hover Lift Effect**
- Add `group-hover:shadow-lg group-hover:scale-[1.01]` and `transition-all duration-200` to the outer `<Link>` wrapper for a subtle lift on hover.

**6. Agent Avatar Chip**
- If `property.agent` exists and has a `profile_image`, render a small `<Avatar>` (24x24) in the bottom-right corner of the image area with a white ring border, similar to Zillow's agent branding.

### Technical Details

```text
Imports to add:
- FavoriteButton from '@/components/property/FavoriteButton'
- CarouselDots from '@/components/shared/CarouselDots'
- Badge from '@/components/ui/badge'
- Avatar, AvatarImage, AvatarFallback from '@/components/ui/avatar'
- ChevronLeft, ChevronRight, Sparkles from 'lucide-react'
- useState, useCallback, memo from 'react'

State:
- imageIndex (number) for carousel position
- isHovered (boolean) for showing arrows

Logic reused from MapListCard:
- getStatusBadge() function (identical copy)
- prevImage / nextImage handlers
- CarouselDots capped at min(total, 5)
```

No CSS changes needed -- the existing popup CSS rules already handle the container. No new dependencies required.
