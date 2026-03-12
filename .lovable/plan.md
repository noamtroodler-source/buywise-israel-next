

## Plan: Agency Project Wizard (`/agency/projects/new`)

This creates a dedicated project wizard for agencies, mirroring the pattern of `AgencyNewPropertyWizard` — reusing the existing developer project wizard steps with an added "Step 0: Assign Agent" and agency-specific submission logic.

### Architecture

The existing developer wizard components (`StepBasics`, `StepDetails`, `StepAmenities`, `StepUnitTypes`, `StepPhotos`, `StepDescription`, `StepReview`) are already well-built and complete. The agency version wraps them identically to how `AgencyNewPropertyWizard` wraps the property wizard steps.

### Files to Create

**1. `src/pages/agency/AgencyNewProjectWizard.tsx`** — Main page component
- Wraps `ProjectWizardProvider` with `totalSteps={8}` (7 existing + 1 assign agent)
- Step 0: `StepAssignAgent` (reuse from `src/components/agency/wizard/StepAssignAgent.tsx`) — selects which agent represents this project
- Steps 1-7: Reuses all existing developer wizard steps (`StepBasics` through `StepReview`)
- On submit: Inserts into `projects` table with `representing_agent_id` set to the selected agent, and `developer_id` set to `null` (agency-listed project, not developer-listed)
- Uses `useAutoSave` with key `project-wizard-draft-agency`
- Save Draft and Submit for Review buttons (same pattern as property wizard)
- Verification check: requires agency verification before submission
- Navigation: "Back to Listings" links to `/agency/listings`

**2. `src/hooks/useAgencyProjects.tsx`** — Agency-specific project mutations
- `useCreateProjectForAgency()` — similar to `useCreateProject` but:
  - Sets `representing_agent_id` instead of `developer_id`
  - Fetches agent record for the selected agent to validate
  - Inserts project_units the same way
  - Sets `verification_status` based on draft vs submit
- `useAgencyProjects()` — fetches all projects where `representing_agent_id` belongs to agents in the agency

### Files to Modify

**3. `src/App.tsx` (or routing file)**
- Add route: `/agency/projects/new` → `AgencyNewProjectWizard`

**4. `src/components/developer/wizard/ProjectWizardContext.tsx`**
- Add `stepOffset` / `setStepOffset` support (same pattern as `PropertyWizardContext`) so validation works correctly when the agency wizard prepends Step 0
- Add `totalSteps` prop to `ProjectWizardProvider`

**5. `src/components/developer/wizard/steps/StepReview.tsx`**
- The `onEditStep` callback needs to account for step offset (agency wizard calls `setCurrentStep(s + 1)` like the property wizard does)

### Key Design Decisions

- **`representing_agent_id`** is the existing FK on `projects` — no schema changes needed
- **`developer_id` = null** for agency-created projects (agencies aren't developers)
- **Reuse all 7 step components** without modification — they use `useProjectWizard()` context which is the same
- **StepAssignAgent** is already generic enough — it shows team members and allows selection
- **Listing limit check** reuses `useListingLimitCheck('agency')` or a new `'agency_project'` type
- **ProjectSubmittedDialog** is reused from the developer flow
- **Minimum 1 photo** validation stays the same (projects don't have the rooms-based dynamic photo rule)

### Step Flow

```text
Step 0: Assign Agent (agency-only)
Step 1: Basics (name, city, address, status)
Step 2: Details (units, pricing, timeline)
Step 3: Amenities (checkboxes + featured highlight)
Step 4: Unit Types (drag-and-drop unit definitions)
Step 5: Gallery (project images)
Step 6: Description (with AI checker)
Step 7: Review (preview + submit)
```

### Validation

Step 0 validation: `!!assignedAgentId` (must select an agent).
Steps 1-7: Existing validation from `ProjectWizardContext` — adjusted by `stepOffset = 1`.

