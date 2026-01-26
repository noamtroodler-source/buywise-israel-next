

# Revamp Compare Projects Page + Unit Type Comparison Feature

## Overview

This plan covers two main objectives:
1. **Unify the Projects Compare page** with the established design patterns from the Rentals/Resale Compare pages
2. **Add optional unit-type comparison** - allowing users to drill down and compare specific unit types (e.g., "4-Room Apartment") across projects

---

## Current State Analysis

| Feature | Resale/Rentals (`Compare.tsx`) | Projects (`CompareProjects.tsx`) |
|---------|-------------------------------|----------------------------------|
| Shared components | Uses `CompareHero`, `CompareSection`, `CompareQuickInsights`, `CompareWinnerSummary` | Does NOT use shared components |
| Comparison table | Clean rows with `CompareSection` | Inline `<table>` in JSX |
| Quick Insights | Reusable component | Inline implementation |
| Winner Summary | Shared component with CTAs | Inline implementation, no CTAs |
| Design consistency | Gradient headers, rounded sections | Basic Card layout |

---

## Part 1: Unify Projects Compare Page

### Goal
Refactor `CompareProjects.tsx` to use the same shared components as the Rentals/Resale pages, creating visual and code consistency.

### Changes

**A. Create new shared components for Projects:**

| New Component | Purpose |
|--------------|---------|
| `CompareProjectCard.tsx` | Card component for project display (mirrors `ComparePropertyCard`) |
| `CompareProjectHero.tsx` | Hero header adapted for projects |

**B. Update `CompareProjects.tsx`:**

| Current | After |
|---------|-------|
| Inline Quick Insights | Use adapted `CompareQuickInsights` or new project-specific version |
| Inline comparison table | Use `CompareSection` component with project-specific rows |
| Inline Winner Summary | Use `CompareWinnerSummary` (adapted for projects) |

**C. Add missing features to Projects Compare:**
- Guest session warning banner (like Rentals/Resale)
- Share functionality improvements
- Consistent CTA buttons in Winner Summary

### Comparison Sections for Projects

| Section | Rows |
|---------|------|
| **Overview** | Price Range, Location, Developer |
| **Construction** | Status, Progress %, Completion Date |
| **Availability** | Total Units, Available Units, Unit Types Count |
| **Amenities** | Gym, Pool, Parking, Security, etc. (visual badges) |

---

## Part 2: Unit Type Comparison (Optional Feature)

### The Question: Is This Worth It?

| Approach | Pros | Cons |
|----------|------|------|
| **Keep it simple (current)** | Less overwhelming, faster to scan | Can't compare specific units |
| **Add unit selector** | Deep comparison, apples-to-apples | More complex UI, extra clicks |

### Recommendation: **Optional Drill-Down**

Add a collapsible "Compare Unit Types" section that appears AFTER the project comparison. Users can optionally select a unit type from each project to compare side-by-side.

### How It Would Work

```text
+--------------------------------------------------+
|  Compare Projects (existing comparison)           |
|  [Project A vs Project B vs Project C]           |
+--------------------------------------------------+
                        |
                        v
+--------------------------------------------------+
|  [Optional Section - Collapsed by Default]       |
|  "Compare Specific Units" (expand button)        |
|  +----------------------------------------------+|
|  | Select unit from Project A: [4-Room Apt  v] ||
|  | Select unit from Project B: [4-Room Apt  v] ||
|  | Select unit from Project C: [3-Room Apt  v] ||
|  +----------------------------------------------+|
|  | Unit Comparison Table                        ||
|  | - Price                                       ||
|  | - Size                                        ||
|  | - Bedrooms/Bathrooms                          ||
|  | - Floor Range                                 ||
|  | - Price per m2                                ||
|  +----------------------------------------------+|
+--------------------------------------------------+
```

### Implementation Details

**A. Fetch project_units data:**
- Already have `useProjectUnits` hook
- Modify to fetch units for all compared projects in one query

**B. Create `CompareUnitTypesSection.tsx`:**
- Collapsible section with Radix Collapsible
- Per-project dropdown to select unit type
- Comparison table showing selected units side-by-side

**C. Unit comparison metrics:**

| Metric | Source | Best Value |
|--------|--------|------------|
| Price (from) | `project_units.price` | Lowest |
| Size | `project_units.size_sqm` | Largest |
| Price/m2 | Calculated | Lowest |
| Bedrooms | `project_units.bedrooms` | Most |
| Bathrooms | `project_units.bathrooms` | Most |
| Floor Range | `project_units.floor` | Highest |
| Floor Plan | `project_units.floor_plan_url` | Has one |

---

## Part 3: File Changes Summary

### New Files

| File | Purpose |
|------|---------|
| `src/components/compare/CompareProjectCard.tsx` | Project card for compare page |
| `src/components/compare/CompareProjectQuickInsights.tsx` | Quick insights adapted for projects |
| `src/components/compare/CompareUnitTypesSection.tsx` | Optional unit comparison section |

### Modified Files

| File | Changes |
|------|---------|
| `src/pages/CompareProjects.tsx` | Refactor to use shared components, add unit comparison |
| `src/components/compare/index.ts` | Export new components |
| `src/components/compare/CompareHero.tsx` | Add project category support |
| `src/components/compare/CompareSection.tsx` | Minor updates for project data type support |
| `src/components/compare/CompareWinnerSummary.tsx` | Support project data type |

---

## Part 4: Technical Implementation

### A. Update CompareHero for Projects

Add `category: 'projects'` support:
```tsx
const getTitle = () => {
  if (category === 'projects') return 'Compare Projects';
  if (category === 'rent') return 'Compare Rentals';
  return 'Compare Properties';
};
```

### B. Create Generic CompareSection for Projects

The existing `CompareSection` already accepts a generic `rows` array. We'll create project-specific row definitions:

```tsx
const projectCoreRows = [
  {
    label: 'Price Range',
    getValue: (p) => formatPriceRange(p.price_from, p.price_to),
    highlight: true,
    getBestProjectId: (projects) => findLowestPriceProject(projects),
  },
  // ... more rows
];
```

### C. Unit Type Comparison Section

```tsx
interface CompareUnitTypesSectionProps {
  projects: CompareProject[];
  projectUnits: Record<string, ProjectUnit[]>; // keyed by project ID
}

function CompareUnitTypesSection({ projects, projectUnits }: Props) {
  const [selectedUnits, setSelectedUnits] = useState<Record<string, string>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Render dropdown per project
  // Render comparison table when all selected
}
```

---

## Complexity Assessment

| Feature | Effort | Value |
|---------|--------|-------|
| Unify design with shared components | Medium | High - code reuse, consistency |
| Add unit type comparison | Medium-High | Medium - power users will love it |

### My Recommendation

**Phase 1 (This implementation):**
- Unify the Projects Compare page with shared components
- Add the Unit Type Comparison section (collapsed by default)

**Why not overwhelming:**
- Unit comparison is OPTIONAL and collapsed by default
- Only users who want to drill down will expand it
- Main project comparison stays prominent and simple
- Smart defaults: auto-select matching unit types across projects when possible

---

## Visual Result

After these changes, the Projects Compare page will:

1. Have the same polished gradient header as Rentals/Resale
2. Use clean, consistent comparison sections with "best value" highlighting
3. Show Quick Insights (Lowest Price, Soonest Completion, etc.)
4. Have a proper Winner Summary with CTA buttons
5. Offer an optional "Compare Unit Types" drill-down for users who want specifics

