
## Mobile-First Project Pages Optimization

### Current Issues Identified

After analyzing `ProjectDetail.tsx`, `Projects.tsx`, and related components, these mobile issues need to be addressed:

1. **ProjectDetail.tsx Container Padding**
   - Uses `py-6` and `container` which adds too much padding on mobile
   - The `grid gap-8` creates excessive spacing between sections on small screens

2. **ProjectHero.tsx Thumbnail Strip**
   - The thumbnail strip with 80px thumbnails can overflow on mobile
   - No edge-to-edge styling applied consistently

3. **ProjectTimeline.tsx Horizontal Timeline**
   - 6 stages with labels in a horizontal row causes text to overlap/truncate on mobile
   - Fixed width percentages (`16.66%`) don't account for narrow screens

4. **ProjectQuickSummary.tsx Stats Bar**
   - `flex flex-wrap gap-6` can cause awkward wrapping on mobile
   - Stats displayed horizontally may not fit well

5. **ProjectFloorPlans.tsx Mobile Cards**
   - Already has mobile cards, but needs tighter padding
   - Floor Plan button placement could be improved

6. **ProjectNextSteps.tsx Grid**
   - Uses `sm:grid-cols-3` which stacks on mobile, but cards have excessive padding

7. **SimilarProjects.tsx Carousel**
   - `basis-full` on mobile is good, but navigation buttons could be better positioned

8. **General Spacing**
   - Section spacing (`space-y-8`) is too generous for mobile screens

---

### Technical Implementation

#### File 1: `src/pages/ProjectDetail.tsx`

**Changes:**
- Reduce container padding: `py-4 md:py-6`
- Reduce grid gap: `gap-4 md:gap-8`
- Reduce section spacing within main column: `space-y-4 md:space-y-8`
- Apply mobile edge-to-edge for key sections

```tsx
// Line 81: Change py-6 to py-4 md:py-6
<div className="container py-4 md:py-6">

// Line 88: Change gap-8 to gap-4 md:gap-8
<motion.div ... className="grid gap-4 md:gap-8 lg:grid-cols-3 mt-4 md:mt-6">

// Line 91: Change space-y-8 to space-y-4 md:space-y-8
<div className="lg:col-span-2 space-y-4 md:space-y-8">
```

---

#### File 2: `src/components/project/ProjectTimeline.tsx`

**Changes:**
- On mobile, convert horizontal timeline to a compact vertical list
- Use `useIsMobile` hook to conditionally render
- Show only current stage prominently with previous/next indicators

**Mobile Layout:**
```text
┌─────────────────────────────────────┐
│ ✓ Pre-Sale                          │
├─────────────────────────────────────┤
│ ● Foundation ← Current (45%)        │
├─────────────────────────────────────┤
│ ○ Structure                         │
│ ○ Finishing                         │
│ ○ Delivery (Est. Dec 2025)          │
└─────────────────────────────────────┘
```

---

#### File 3: `src/components/project/ProjectQuickSummary.tsx`

**Changes:**
- Make stats grid use fixed 2 columns on mobile: `grid grid-cols-2 sm:flex sm:flex-wrap gap-4 sm:gap-6`
- Reduce font sizes on mobile for better fit
- Tighter border padding

---

#### File 4: `src/components/project/ProjectHero.tsx`

**Changes:**
- Hide thumbnail strip on mobile (dots are sufficient)
- Ensure back button has proper mobile styling
- The main image and gallery are already good

---

#### File 5: `src/components/project/ProjectNextSteps.tsx`

**Changes:**
- Reduce card padding on mobile: `p-3 md:p-4`
- Icon container slightly smaller on mobile
- Already stacks correctly with `sm:grid-cols-3`

---

#### File 6: `src/components/project/ProjectFloorPlans.tsx`

**Changes:**
- Reduce mobile card padding: `p-3 md:p-4`
- Make Floor Plan button more compact
- Reduce inner grid spacing

---

#### File 7: `src/components/project/ProjectCostBreakdown.tsx`

**Changes:**
- Ensure collapsibles start closed on mobile
- Reduce section header sizes
- The component already has good mobile structure

---

#### File 8: `src/components/project/SimilarProjects.tsx`

**Changes:**
- Use edge-to-edge carousel on mobile: `-mx-4 px-4` with `overflow-visible`
- Reduce header spacing on mobile
- Make navigation buttons always visible on mobile

---

#### File 9: `src/components/project/ProjectDeveloperCard.tsx` and `ProjectAgentCard.tsx`

**Changes:**
- Reduce card content padding on mobile: `p-3 md:p-4`
- Ensure buttons stack properly

---

### Summary of Key Changes

| Component | Mobile Change |
|-----------|---------------|
| `ProjectDetail.tsx` | Reduce container padding & section gaps |
| `ProjectTimeline.tsx` | Vertical compact timeline on mobile |
| `ProjectQuickSummary.tsx` | 2-column grid for stats |
| `ProjectHero.tsx` | Hide thumbnail strip on mobile |
| `ProjectNextSteps.tsx` | Tighter card padding |
| `ProjectFloorPlans.tsx` | Compact mobile cards |
| `SimilarProjects.tsx` | Edge-to-edge carousel styling |
| `ProjectDeveloperCard.tsx` | Reduced padding |

---

### Files to Modify

1. `src/pages/ProjectDetail.tsx` - Page-level spacing
2. `src/components/project/ProjectTimeline.tsx` - Mobile vertical timeline
3. `src/components/project/ProjectQuickSummary.tsx` - Stats grid layout
4. `src/components/project/ProjectHero.tsx` - Hide thumbnails on mobile
5. `src/components/project/ProjectNextSteps.tsx` - Card padding
6. `src/components/project/ProjectFloorPlans.tsx` - Mobile card optimization
7. `src/components/project/SimilarProjects.tsx` - Carousel mobile styling
8. `src/components/project/ProjectDeveloperCard.tsx` - Padding reduction
