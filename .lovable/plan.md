

# Phase A: Data Safety & Error Resilience

## Summary

Three improvements: (1) add unsaved-changes warning to edit wizards, (2) improve image upload with per-file error handling and retry, (3) fix cache invalidation gaps.

## 1. Edit Wizard Unsaved Changes Warning

Both `EditPropertyWizard.tsx` (agent) and `AgencyEditPropertyWizard.tsx` (agency) load saved property data into the wizard but have no `beforeunload` warning if the user navigates away with changes.

**Changes in `src/pages/agent/EditPropertyWizard.tsx`**:
- Import `useAutoSave` with the property ID as the storage key (`edit-property-draft-${propertyId}`)
- Pass `data` and `metadata: { currentStep }` to track dirty state
- The `beforeunload` handler in `useAutoSave` will fire automatically when `isDirty` is true
- Call `clearSavedData()` on successful save/submit
- No draft recovery dialog for edits (the source of truth is the DB), only the unsaved warning matters

**Changes in `src/pages/agency/AgencyEditPropertyWizard.tsx`**:
- Same pattern with key `agency-edit-property-draft-${propertyId}`

## 2. Image Upload Error Handling with Retry

Currently `SortableImageUpload` uses `Promise.all` — if any single upload fails, ALL uploads fail and no images are added. Users get stuck.

**Changes in `src/components/agent/SortableImageUpload.tsx`**:
- Replace `Promise.all` with `Promise.allSettled` to handle partial failures
- Add successfully uploaded images immediately
- Track failed files in a `failedUploads` state: `{ file: File, error: string }[]`
- Show a "retry" UI for failed uploads: a list of failed filenames with a "Retry" button per file or "Retry All"
- On retry, attempt upload again for just those files
- Add file size validation (reject >10MB upfront with toast) before upload attempt

**Changes in `src/components/developer/wizard/steps/StepPhotos.tsx`**:
- Already has per-file error handling — add a retry button for failed uploads using the same pattern

## 3. Cache Invalidation Fix

After inspecting the code, bulk mutations (`useBulkDeleteProperties`, `useBulkSubmitForReview`) already invalidate `agentProperties` in `onSettled`. The dashboard (`AgentDashboard.tsx`) derives all counts from the same `agentProperties` query, so counts update automatically.

**However**, `useBulkSubmitForReview` doesn't invalidate `agencyListingsManagement` or `properties` (general). Fix:

**Changes in `src/hooks/useAgentProperties.tsx`**:
- Add `queryClient.invalidateQueries({ queryKey: ['properties'] })` to `useBulkSubmitForReview.onSettled`
- Add `queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] })` to `useBulkSubmitForReview.onSettled`

## Files Touched

| File | Action |
|------|--------|
| `src/pages/agent/EditPropertyWizard.tsx` | Add `useAutoSave` for dirty tracking + beforeunload warning |
| `src/pages/agency/AgencyEditPropertyWizard.tsx` | Same pattern |
| `src/components/agent/SortableImageUpload.tsx` | `Promise.allSettled`, failed upload state, retry UI |
| `src/hooks/useAgentProperties.tsx` | Add missing invalidations to `useBulkSubmitForReview` |

