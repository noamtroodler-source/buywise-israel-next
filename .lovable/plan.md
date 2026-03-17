

# Free Navigation + Validation Summary for Project Wizard

Apply the same pattern already implemented for the property wizard to the project wizard: free navigation through all steps, with validation enforced only at submit time.

## Changes

### 1. `ProjectWizardContext.tsx` — Add `getStepErrors` + `getAllErrors`

Add validation functions mirroring the property wizard pattern. Export `ProjectStepValidationError` type.

**Errors per effective step:**
- **Basics (0)**: Missing name, city, neighborhood, address, or coordinates; address without street number
- **Details (1)**: Completion date before start date (if both set)
- **Photos (4)**: Less than 1 image
- **Description (5)**: Empty description

Steps 2 (Amenities), 3 (Unit Types), 6 (Review) have no required validation — they return empty arrays.

Expose `getStepErrors` and `getAllErrors` on the context. Keep `canGoNext` for submit gating only.

### 2. Remove `disabled={!canGoNext}` from Next buttons in all 3 project wizard pages

| File | Line | Change |
|------|------|--------|
| `NewProjectWizard.tsx` | ~273 | Remove `disabled={!canGoNext}` from Next button |
| `EditProjectWizard.tsx` | ~405 | Remove `disabled={!canGoNext}` from Next button |
| `AgencyNewProjectWizard.tsx` | ~275 | Remove `disabled={!canGoNextAgency}` from Next button |

### 3. Pass `stepErrors` to `WizardProgress` in all 3 pages

Compute `stepErrors` from `getStepErrors` for each step index and pass to the existing `WizardProgress` component (which already supports the `stepErrors` prop from the property wizard work).

### 4. Add `ValidationSummary` to project `StepReview.tsx`

Import the existing `ValidationSummary` component from `@/components/agent/wizard/steps/ValidationSummary`. Show it at the top of the review step when there are errors. Wire `onGoToStep` to `onEditStep` (already a prop).

### 5. Gate Submit buttons with `getAllErrors`

Replace `!canGoNext` / `!canGoNextAgency` in submit button disabled conditions with `getAllErrors().length > 0` for a clearer check.

## Files Changed

| File | Change |
|------|--------|
| `ProjectWizardContext.tsx` | Add `getStepErrors`, `getAllErrors`, export types |
| `NewProjectWizard.tsx` | Remove Next disabled, pass stepErrors, gate submit with getAllErrors |
| `EditProjectWizard.tsx` | Same |
| `AgencyNewProjectWizard.tsx` | Same (with stepOffset handling) |
| `StepReview.tsx` (developer) | Add ValidationSummary at top |

