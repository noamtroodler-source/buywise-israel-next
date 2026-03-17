

# Free Navigation + Validation Summary on Submit

## Overview
Remove step-by-step blocking from all wizard flows. The "Next" button always works. Validation errors are collected and shown on the Review step when the agent tries to submit. Error indicators appear on incomplete steps in the progress bar.

## Changes

### 1. `PropertyWizardContext.tsx` — Add `getStepErrors` + `getAllErrors`

Export a `getStepErrors(step: number): string[]` function that returns human-readable errors for each adjusted step (0-5). Also `getAllErrors(): { step: number; errors: string[] }[]`. Remove `canGoNext` from controlling navigation — keep it only for submit gating.

Errors per step:
- **Basics (0)**: Title < 20 chars, no price, no city, no neighborhood, no address, no coordinates, no street number
- **Details (1)**: Missing size, missing floor/total_floors for apartments, etc.
- **Features (2)**: Missing entry date (if not immediate), missing lease fields for rentals
- **Photos (3)**: Not enough photos (min = bedrooms + additional + bathrooms, floor 3)
- **Description (4)**: Description < 100 chars

### 2. `PropertyWizardContext.tsx` — `goNext` always advances

Remove the `canGoNext` gate from the Next button. `goNext` already just increments the step. The `canGoNext` boolean stays exposed for submit button gating.

### 3. All 4 wizard pages — Remove `disabled={!canGoNext}` from Next button

- `AgencyNewPropertyWizard.tsx` line ~303
- `AgencyEditPropertyWizard.tsx` line ~324
- `NewPropertyWizard.tsx` line ~325
- `EditPropertyWizard.tsx` line ~482

Change: `disabled={!canGoNext}` → removed (button always enabled).

Submit buttons keep their `!canGoNext` check but replace it with `getAllErrors().length > 0` for a more descriptive gate.

### 4. `WizardProgress.tsx` — Show error dots on incomplete steps

Accept new optional prop `stepErrors?: Record<number, number>` (step index → error count). Show a small red dot badge on steps that have errors and are not the current step. Completed steps with errors get a warning indicator instead of a checkmark.

### 5. `StepReview.tsx` — Validation summary with clickable step links

When there are errors, show an alert at the top listing all missing fields grouped by step name. Each step group is clickable to jump to that step via `onEditStep`. The submit button area also shows a brief "Please fix X issues before submitting" message.

### 6. All 4 wizard pages — Pass `stepErrors` to `WizardProgress` and handle submit validation

Compute `stepErrors` from `getStepErrors` and pass to `WizardProgress`. On submit click, if errors exist, show a toast summarizing the count and scroll to review's validation summary.

## Files Changed

| File | Change |
|------|--------|
| `PropertyWizardContext.tsx` | Add `getStepErrors`, `getAllErrors` to context |
| `WizardProgress.tsx` | Add `stepErrors` prop, render red dots |
| `StepReview.tsx` | Add validation summary section with clickable step links |
| `AgencyNewPropertyWizard.tsx` | Enable Next always, pass stepErrors, validation on submit |
| `AgencyEditPropertyWizard.tsx` | Same |
| `NewPropertyWizard.tsx` | Same |
| `EditPropertyWizard.tsx` | Same |

