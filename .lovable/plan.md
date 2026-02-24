

# Make Wizard Steps Clickable

## What Changes
The step indicators at the top of the wizard (1 Basics, 2 Details, etc.) will become clickable, so you can jump directly to any step instead of clicking Next/Previous repeatedly.

## How It Works
- Each numbered step circle becomes a button
- Clicking any step takes you directly to that step
- This will work across all wizards (agency edit, agent edit, developer edit, and new listing wizards)

## Technical Details

### 1. Update `WizardProgress` component (`src/components/agent/wizard/WizardProgress.tsx`)
- Add an optional `onStepClick` prop to the component
- When provided, wrap each step indicator in a clickable button with a pointer cursor
- When not provided, behavior stays the same (non-clickable) for backward compatibility

### 2. Pass `onStepClick` in all edit wizards
Wire up the `setCurrentStep` function as the `onStepClick` handler in these files:
- `src/pages/agency/AgencyEditPropertyWizard.tsx`
- `src/pages/agent/EditPropertyWizard.tsx`
- `src/pages/developer/EditProjectWizard.tsx`

Also add it to new-listing wizards so the experience is consistent:
- `src/pages/agency/AgencyNewPropertyWizard.tsx`
- `src/pages/agent/NewPropertyWizard.tsx`
- `src/pages/developer/NewProjectWizard.tsx`

