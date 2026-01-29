
# Mobile UX Enhancement Plan for BuyWise Israel

## Overview
A comprehensive set of improvements to enhance the mobile experience across the platform, prioritized by user impact and implementation complexity. These changes follow the Zillow-style patterns already established with the homepage carousels.

---

## Phase 1: High-Impact Quick Wins

### 1.1 Tools Page Mobile Carousel
Convert the tool cards grid into a horizontal swipeable carousel on mobile (matching homepage pattern).

**Files to modify:**
- `src/pages/Tools.tsx`

**Changes:**
- Import `useIsMobile` hook and `useEmblaCarousel`
- Add `CarouselDots` component for navigation
- Render carousel for mobile, keep grid for desktop
- Group tools by phase with individual carousels per section

---

### 1.2 Guides Page Mobile Carousel
Apply the same carousel treatment to guide cards.

**Files to modify:**
- `src/pages/Guides.tsx`

**Changes:**
- Same pattern as Tools - carousel per journey phase section on mobile
- Keep the visual hierarchy with phase headers

---

### 1.3 Blog Category Horizontal Scroll
Add horizontal scrolling category chips on the Blog page.

**Files to modify:**
- `src/components/blog/BlogFilters.tsx`

**Changes:**
- Make category pills horizontally scrollable on mobile
- Add fade gradient at scroll edges to indicate more content
- Sticky position at top when scrolling

---

## Phase 2: Listings & Filters Overhaul

### 2.1 Full-Screen Mobile Filter Sheet
Replace popover-based filters with a full-screen bottom sheet on mobile.

**Files to modify:**
- `src/components/filters/PropertyFilters.tsx`
- Create new `src/components/filters/MobileFilterSheet.tsx`

**Changes:**
- Detect mobile and render Sheet instead of Popover components
- Organize filters in scrollable sections within the sheet
- Add sticky "Show X Results" button at bottom
- Include "Clear All" and individual filter clear buttons
- Horizontal scrolling for applied filter chips below the main filter bar

---

### 2.2 Sticky Filter Bar on Scroll
Make the filter chips bar sticky when scrolling on mobile.

**Files to modify:**
- `src/pages/Listings.tsx`
- `src/pages/Projects.tsx`

**Changes:**
- Add `sticky top-0 z-40` to filter container on mobile
- Add subtle shadow when scrolled
- Background blur for visual separation

---

### 2.3 Quick Filter Chips
Add tap-friendly preset filter chips for common searches.

**Changes:**
- "Under ₪2M" / "Under ₪3M" price presets
- "3+ Rooms" / "4+ Rooms" room presets  
- "New Listings" (last 7 days)
- Horizontal scroll for chips

---

## Phase 3: Property Detail Mobile Experience

### 3.1 Collapsible Sections with Accordions
Convert lengthy detail sections into expandable accordions on mobile.

**Files to modify:**
- `src/pages/PropertyDetail.tsx`
- `src/components/property/PropertyCostBreakdown.tsx`
- `src/components/property/PropertyValueSnapshot.tsx`

**Changes:**
- Wrap major sections (Cost Breakdown, Value Snapshot, Location) in collapsible accordions
- Show summary/preview when collapsed
- Remember expansion state in session storage
- Keep desktop layout unchanged

---

### 3.2 Sticky Section Navigation
Add a compact sticky navigation bar that lets users jump between sections.

**Files to create:**
- `src/components/property/MobileSectionNav.tsx`

**Implementation:**
- Horizontal scrolling nav with section names: Photos | Details | Costs | Map | Similar
- Highlight current section based on scroll position (Intersection Observer)
- Smooth scroll to section on tap
- Only visible on mobile, appears after scrolling past hero

---

### 3.3 Enhanced Mobile Contact Bar
Improve the bottom contact bar with more actions.

**Files to modify:**
- `src/components/property/StickyContactCard.tsx`

**Changes:**
- Add share button alongside WhatsApp
- Add save/favorite button
- Show price in the bar for reference
- Animate in on scroll (not visible at very top when CTA is in view)

---

## Phase 4: Gesture & Interaction Improvements

### 4.1 Swipe Between Property Images in Gallery
Already exists via `useTouchSwipe` - ensure it works smoothly.

### 4.2 Pull-to-Refresh Consistency
Extend `PullToRefresh` to more pages.

**Files to modify:**
- `src/pages/Projects.tsx` - Add PullToRefresh wrapper
- `src/pages/Favorites.tsx` - Add PullToRefresh wrapper
- `src/pages/Blog.tsx` - Add PullToRefresh wrapper

---

### 4.3 Haptic Feedback (Progressive Enhancement)
Add subtle haptic feedback for key interactions.

**Implementation:**
- Use `navigator.vibrate()` API for supported devices
- Add to: favorite toggle, filter apply, pull-to-refresh threshold

---

## Phase 5: Empty States & Loading UX

### 5.1 Enhanced Loading Skeletons
Improve skeleton states to match content layout better.

**Files to modify:**
- `src/pages/Listings.tsx`
- `src/pages/Projects.tsx`

**Changes:**
- Mobile: Show 1 larger skeleton card matching carousel layout
- Add subtle shimmer animation
- Match exact card dimensions to prevent layout shift

---

### 5.2 Actionable Empty States
Make empty states more engaging and helpful on mobile.

**Changes:**
- Larger, more playful illustrations
- Clear primary action button
- Secondary suggestions
- Context-aware messaging (different for "no results" vs "no saved")

---

## Phase 6: Navigation Enhancements

### 6.1 Recent Searches
Show recent search terms when focusing the search/filter.

**Files to create:**
- `src/hooks/useRecentSearches.ts`
- Integrate into PropertyFilters

**Implementation:**
- Store last 5 searches in localStorage
- Show as tappable chips when filter sheet opens
- Clear all option

---

### 6.2 Improved Mobile Menu
Enhance the bottom sheet menu with better organization.

**Files to modify:**
- `src/components/layout/MobileBottomNav.tsx`

**Changes:**
- Group menu items by category (Browse, Learn, Tools, Account)
- Add icons to menu items
- Show user avatar/login status at top if authenticated
- Quick access to saved/favorites count

---

## Implementation Priority

| Phase | Effort | Impact | Priority |
|-------|--------|--------|----------|
| 1.1 Tools Carousel | Low | Medium | High |
| 1.2 Guides Carousel | Low | Medium | High |
| 2.1 Mobile Filter Sheet | Medium | High | High |
| 3.1 Collapsible Sections | Medium | High | High |
| 3.2 Section Navigation | Medium | Medium | Medium |
| 2.2 Sticky Filters | Low | Medium | Medium |
| 4.2 Pull-to-Refresh | Low | Low | Medium |
| 5.1 Loading Skeletons | Low | Medium | Medium |
| 6.2 Improved Menu | Medium | Medium | Low |

---

## Technical Notes

- All carousels use `embla-carousel-react` (already installed)
- Mobile detection via existing `useIsMobile()` hook
- Accordions use Radix UI `Collapsible` (already installed)
- Bottom sheets use existing `Sheet` component from shadcn/ui
- All changes maintain desktop experience unchanged
