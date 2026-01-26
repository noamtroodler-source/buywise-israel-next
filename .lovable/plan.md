
# Fix Project Progress Bar to Reflect Stage Position

## Problem Identified

On the Projects listing page, the progress bar on each project card shows **0%** for "Planning" and "Pre-Sale" stages, despite these being meaningful milestones. The user wants the bar to be divided into 6 equal segments reflecting the 6-stage lifecycle.

### Current Logic (Broken)
In `src/pages/Projects.tsx` lines 267-274:
```tsx
<Progress 
  value={
    project.status === 'delivery' ? 100 :
    ['foundation', 'structure', 'finishing'].includes(project.status) 
      ? ((project as any).construction_progress_percent || 0) :
    0  // <-- Planning & Pre-Sale always show 0%
  } 
/>
```

### Correct Logic (Already in ProjectTimeline.tsx)
```tsx
const stages = ['planning', 'pre_sale', 'foundation', 'structure', 'finishing', 'delivery'];
const currentStageIndex = stages.findIndex(s => s === project.status);
const stageProgress = ((currentStageIndex + 1) / stages.length) * 100;
```

This gives each stage a meaningful progress value:

| Stage | Index | Progress |
|-------|-------|----------|
| Planning | 0 | ~17% (1/6) |
| Pre-Sale | 1 | ~33% (2/6) |
| Foundation | 2 | 50% (3/6) |
| Structure | 3 | ~67% (4/6) |
| Finishing | 4 | ~83% (5/6) |
| Delivery | 5 | 100% (6/6) |

## The Fix

### File: `src/pages/Projects.tsx`

**Step 1:** Add a helper function to calculate stage-based progress (around line 50, with other helpers)

```tsx
// Calculate progress based on stage position (6 stages total)
const getStageProgress = (status: string): number => {
  const stages = ['planning', 'pre_sale', 'foundation', 'structure', 'finishing', 'delivery'];
  const stageIndex = stages.findIndex(s => s === status);
  if (stageIndex === -1) return 0;
  // Each completed stage represents a portion of the bar
  // Stage 0 (planning) = 1/6, Stage 5 (delivery) = 6/6 = 100%
  return Math.round(((stageIndex + 1) / stages.length) * 100);
};
```

**Step 2:** Update the Progress component value (lines 267-274)

Before:
```tsx
<Progress 
  value={
    project.status === 'delivery' ? 100 :
    ['foundation', 'structure', 'finishing'].includes(project.status) 
      ? ((project as any).construction_progress_percent || 0) :
    0
  } 
  className="h-1.5" 
/>
```

After:
```tsx
<Progress 
  value={getStageProgress(project.status)} 
  className="h-1.5" 
/>
```

**Step 3:** Update the right-side percentage display (lines 260-265)

Before:
```tsx
<span className="font-medium text-primary">
  {project.status === 'planning' && 'Coming Soon'}
  {project.status === 'pre_sale' && 'Starting Soon'}
  {['foundation', 'structure', 'finishing'].includes(project.status) && `${(project as any).construction_progress_percent || 0}%`}
  {project.status === 'delivery' && '100%'}
</span>
```

After:
```tsx
<span className="font-medium text-primary">
  {getStageProgress(project.status)}%
</span>
```

## Result After Fix

| Project Status | Bar Fill | Display |
|----------------|----------|---------|
| Planning | 17% | 17% |
| Pre-Sale | 33% | 33% |
| Foundation | 50% | 50% |
| Structure | 67% | 67% |
| Finishing | 83% | 83% |
| Delivery | 100% | 100% |

All project cards will now show an accurate, consistent progress bar based on their lifecycle stage, dividing the bar into 6 equal segments.
