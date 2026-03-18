

## Fix: Inconsistent Progress Percentage Between Components

### Root Cause
Two components display construction progress using **different sources**:
- **ProjectQuickSummary** (line 136): Shows raw DB value `project.construction_progress_percent` (e.g., 11%)
- **ProjectTimeline** (line 51/190): Derives progress from the stage index via `STAGE_PROGRESS` array (Pre-Sale → 10%)

The DB stores a developer-entered value (11%), but the timeline snaps to stage-based milestones (10%). These will always conflict.

### Solution
Create a **single shared utility** that computes the canonical progress percentage, and use it in both components. The timeline's stage-derived approach is the correct one (per the memory on timeline synchronization), so the quick summary should use the same derived value.

### Changes

1. **Create `src/lib/projectProgress.ts`** — Extract the stage/progress logic from ProjectTimeline into a shared utility:
   - Export `getProjectStageIndex(status, rawPercent)` and `getProjectProgress(status, rawPercent)` 
   - Contains the `stages`, `STAGE_PROGRESS`, `STATUS_MAP`, and `inferStageFromPercent` logic

2. **Update `src/components/project/ProjectTimeline.tsx`** — Import from the shared utility instead of defining locally. Remove duplicated constants.

3. **Update `src/components/project/ProjectQuickSummary.tsx`** — Replace `project.construction_progress_percent` (line 136) with the derived value from `getProjectProgress(project.status, project.construction_progress_percent)`.

4. **Audit other consumers** — Search for any other component using `construction_progress_percent` directly and replace with the shared utility to prevent future drift.

This ensures every place on the project page that shows progress will always agree, and any new component can import the same function.

