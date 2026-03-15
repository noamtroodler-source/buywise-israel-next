

# Phase 5: Form UX — Listing Draft Auto-Save & Unsaved Changes Warning

## Current State

The `useAutoSave` hook and `SaveStatusIndicator` already exist but are underutilized:
- `useSessionKey: true` generates a unique localStorage key per session, so **drafts are never recoverable** after closing the tab
- The wizard never checks for or offers to restore a previous draft on mount
- The `beforeunload` warning in `useAutoSave` fires based on `isDirty`, but since data saves to localStorage every 500ms, `isDirty` is almost never true — making the warning ineffective
- The agency wizard (`AgencyNewPropertyWizard.tsx`) has the same issues

## Changes

### 1. Fix `useAutoSave` to persist drafts across sessions

**Edit `src/hooks/useAutoSave.ts`**:
- Change default `useSessionKey` to `false` so drafts use a stable key (`property-wizard-draft`)
- Track dirty state against the **initial data at mount** rather than the last localStorage write, so `isDirty` reflects "has the user made changes since loading the wizard"
- The `beforeunload` warning will then correctly fire when navigating away with real unsaved work

### 2. Add draft recovery dialog to `NewPropertyWizard.tsx`

**Edit `src/pages/agent/NewPropertyWizard.tsx`**:
- On mount, call `autoSave.getSavedData()` to check for a previous draft
- If found, show a confirmation dialog: "Resume previous draft?" with Resume / Start Fresh buttons
- Resume: call `loadFromSaved(savedData)` to populate the wizard
- Start Fresh: call `autoSave.clearSavedData()` and continue with defaults
- Also save `currentStep` alongside `data` so the user resumes at the right step

### 3. Save current step in auto-save payload

**Edit `src/hooks/useAutoSave.ts`**:
- Accept an optional `metadata` parameter (for storing `currentStep`)
- Save and restore metadata alongside the data payload

**Edit `src/components/agent/wizard/PropertyWizardContext.tsx`**:
- No changes needed — `loadFromSaved` and `setCurrentStep` already exist

### 4. Apply same pattern to `AgencyNewPropertyWizard.tsx`

**Edit `src/pages/agency/AgencyNewPropertyWizard.tsx`**:
- Mirror the draft recovery logic using a different storage key (`agency-property-wizard-draft`)

### 5. Clear draft on successful submit/save

Already handled — both wizards call `autoSave.clearSavedData()` on successful create. No changes needed.

## Files Touched

| File | Action |
|------|--------|
| `src/hooks/useAutoSave.ts` | Fix `useSessionKey` default, add metadata support, fix dirty tracking |
| `src/pages/agent/NewPropertyWizard.tsx` | Add draft recovery dialog on mount |
| `src/pages/agency/AgencyNewPropertyWizard.tsx` | Add draft recovery dialog on mount |

