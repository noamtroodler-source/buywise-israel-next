

# Fix: Construction Timeline Stage/Progress Mismatch

## Root Cause
The timeline component has a hardcoded stages array with 6 statuses (`planning`, `pre_sale`, `foundation`, `structure`, `finishing`, `delivery`), but the database contains statuses like `under_construction` that don't match any of them. When `findIndex` fails, it returns `-1`, which gets clamped to `0` (Planning). Meanwhile, the "X% Complete" badge reads directly from `construction_progress_percent` in the database -- a completely independent value.

This means any project with a non-matching status OR a manually-set percentage will show contradictory information.

## The Fix (in `ProjectTimeline.tsx`)

### 1. Derive the displayed progress from the stage, not the database
Instead of blindly showing `construction_progress_percent`, calculate it from the current stage index. This guarantees the percentage always matches the stepper visually.

Stage-based progress mapping:
- Planning = 0%
- Pre-Sale = 10%
- Foundation = 30%
- Structure = 50%
- Finishing = 75%
- Delivery = 100%

### 2. Add a status-mapping layer for unrecognized statuses
Map known database statuses that don't appear in the stages array to the closest stage:
- `under_construction` maps to `structure` (mid-construction)
- `completed` maps to `delivery`
- Any other unknown status: infer from `construction_progress_percent` as a fallback (e.g., 94% would land on "Finishing")

### 3. Update the TypeScript type
Add `under_construction` and `completed` to the `ProjectStatus` union in `types/projects.ts` so this is explicit.

## Files to Change

**`src/components/project/ProjectTimeline.tsx`**
- Add a `STATUS_MAP` to normalize database statuses to timeline stages
- Add a `STAGE_PROGRESS` array mapping each stage index to a percentage
- Replace `const progress = project.construction_progress_percent || 0` with derived progress from stage index
- Add fallback logic: if status is unrecognized, use `construction_progress_percent` to pick the closest stage

**`src/types/projects.ts`**
- Expand `ProjectStatus` to include `under_construction` and `completed`

## What This Prevents
- Any future status value that doesn't match the 6-stage array will be gracefully mapped instead of defaulting to Planning
- The percentage and the stepper will always agree since percentage is derived from the stage position
- No more contradictory UI (e.g., "Planning" + "94% Complete")
