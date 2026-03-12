

## Plan: Remove `available_units` from the Site

Remove the "Available Units" field from all wizard inputs and display components. The database column stays (harmless), but nothing references it in the UI anymore.

### Files to Edit

**1. Wizard Input — `src/components/developer/wizard/steps/StepDetails.tsx`**
- Remove the "Available Units" `FormattedNumberInput` block entirely

**2. Wizard Context — `src/components/developer/wizard/ProjectWizardContext.tsx`**
- Remove `available_units` from `ProjectWizardData` interface and `defaultProjectData`

**3. Wizard Submissions**
- `src/pages/developer/NewProjectWizard.tsx` — Remove `available_units` from both insert payloads
- `src/pages/agency/AgencyNewProjectWizard.tsx` — Remove `available_units` from insert payload

**4. Wizard Review/Preview**
- `src/components/developer/wizard/steps/StepReview.tsx` — Remove the "Available Units" row
- `src/components/developer/wizard/steps/ProjectPreviewDialog.tsx` — Remove the "Available" row

**5. Project Display — `src/components/project/ProjectQuickSummary.tsx`**
- Change units display from `available_units/total_units "Units Left"` → just `total_units "Units"`

**6. Compare Features**
- `src/components/compare/CompareProjectCard.tsx` — Show just `total_units` instead of `available/total`
- `src/components/compare/CompareProjectQuickInsights.tsx` — Remove "Most Available Units" insight block; remove `available_units` from interface
- `src/pages/CompareProjects.tsx` — Remove "Available Units" and "Availability Rate" comparison rows; remove from `CompareProject` interface

**7. Other Display**
- `src/components/map-search/MapProjectOverlay.tsx` — Remove `available_units` from stats line, use `total_units` if needed
- `src/components/admin/ProjectPreviewModal.tsx` — Show just total units instead of available/total
- `src/components/project/SimilarProjects.tsx` — Remove from interface
- `src/types/projects.ts` — Remove `available_units` from `Project` interface

No database migration needed — the column remains nullable and unused.

