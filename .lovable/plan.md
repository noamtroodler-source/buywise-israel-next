
# Move Project Progress Bar to Bottom of Cards on Developer Profile

## Overview
Update the `ProjectCard` component in `DeveloperDetail.tsx` to match the project card layout on the main Projects page. Move the construction timeline/progress bar from the image overlay to the bottom section of the card content, using the 6-stage lifecycle logic.

## Current vs Desired Layout

**Current Layout (DeveloperDetail):**
```text
+---------------------------+
|  [Project Image]          |
|                           |
|  +---------------------+  |
|  | Progress       33%  |  |  <-- On top of image
|  | [▓▓▓▓▓░░░░░]       |  |
|  +---------------------+  |
+---------------------------+
|  [Pre-Sale Badge]    👁 42|
|  Project Name             |
|  Location                 |
|  -------------------------|
|  Starting from            |
|  ₪2,400,000               |
+---------------------------+
```

**Desired Layout (matching Projects.tsx):**
```text
+---------------------------+
|  [Project Image]          |
|                           |
|                           |
|                           |
+---------------------------+
|  [Pre-Sale Badge]    👁 42|
|  Project Name             |
|  Location                 |
|  -------------------------|
|  Pre-Sale            33%  |  <-- Below content
|  [▓▓▓▓▓▓▓▓░░░░░░░░]      |
|  -------------------------|
|  Starting from            |
|  ₪2,400,000               |
+---------------------------+
```

## Changes

### File: `src/pages/DeveloperDetail.tsx`

**1. Add Progress component import:**
```typescript
import { Progress } from '@/components/ui/progress';
```

**2. Add the 6-stage progress calculation function (same as Projects.tsx):**
```typescript
const getStageProgress = (status: string): number => {
  const stages = ['planning', 'pre_sale', 'foundation', 'structure', 'finishing', 'delivery'];
  const stageIndex = stages.findIndex(s => s === status);
  if (stageIndex === -1) return 0;
  return Math.round(((stageIndex + 1) / stages.length) * 100);
};
```

**3. Update `getStatusLabel` to match Projects.tsx labels:**
- 'planning' → 'Planning Phase'
- 'pre_sale' → 'Pre-Sale'
- 'foundation' → 'Foundation'
- 'structure' → 'Structure'
- 'finishing' → 'Finishing'
- 'delivery' → 'Ready for Move-In'

**4. Modify ProjectCard component:**

**Remove:** The progress bar overlay from inside the image container (lines 516-531)

**Add:** New progress bar section in CardContent, between location and price sections:

```tsx
{/* Project Status Progress Bar */}
<div className="space-y-1.5">
  <div className="flex items-center justify-between text-xs">
    <span className="text-muted-foreground">
      {getStageLabel(project.status)}
    </span>
    <span className="font-medium text-primary">
      {getStageProgress(project.status)}%
    </span>
  </div>
  <Progress 
    value={getStageProgress(project.status)} 
    className="h-1.5" 
  />
</div>
```

**5. Update ProjectCard props interface:**
Add `getStageProgress` function to props, or define it inside the component.

## Final Card Structure

```text
CardContent (p-5 space-y-3)
├── Status Badge + Views row
├── Project Name (h3)
├── Location text
├── Progress Bar section (NEW)  <-- Moved here
│   ├── Stage Label (left) + Percentage (right)
│   └── Progress component (h-1.5)
└── Price section (border-t)
    ├── "Starting from" label
    └── Price value
```

## Technical Notes

| Item | Detail |
|------|--------|
| Progress stages | planning (17%), pre_sale (33%), foundation (50%), structure (67%), finishing (83%), delivery (100%) |
| Progress component | Uses `@/components/ui/progress` (already in project) |
| Status badge | Remains at top of card content |
| Image section | Clean - no overlay elements |

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/DeveloperDetail.tsx` | Modify ProjectCard layout |
