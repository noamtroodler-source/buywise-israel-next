

## Remove Featured Highlight from Project Pages & Wizards

The "featured selling point" with the star icon and border-left accent (shown in screenshot) appears in two project-related areas that need cleanup:

### Changes

1. **`src/components/project/ProjectQuickSummary.tsx`** — Remove the "Featured Selling Point" block (lines 117-127) that renders `project.featured_highlight` with the Star icon and left border accent. Also remove `Star` from imports and `featured_highlight` from the props interface.

2. **`src/components/developer/wizard/steps/StepAmenities.tsx`** — Remove the entire "Featured Selling Point" section (the gradient card with Star icon, Input field, and character counter, ~lines 96-118). Remove the `Star` import.

3. **`src/pages/developer/NewProjectWizard.tsx`** — Remove `featured_highlight` from the submission payloads (lines 82 and 114).

4. **`src/pages/developer/EditProjectWizard.tsx`** — Remove `featured_highlight` from the data loading (line 151) and save payload (line 179).

5. **`src/components/developer/wizard/ProjectWizardContext.tsx`** (need to check) — Remove `featured_highlight` from the wizard data type and initial state.

The database column stays — it's still used by property/agent wizards. This only removes it from **project** flows.

