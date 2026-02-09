

## Apply Agency Wizard Safeguards to Developer and Agent Registration

### What needs fixing

The Agency registration wizard now has three safeguards that the Developer and Agent registration flows are missing:

1. **Scroll-to-top on step change** -- Developer wizard has 3 steps but no scroll reset, so navigating Next/Back can land users mid-page
2. **Draft persistence** -- Developer wizard loses all form data on refresh/session loss
3. **Auth redirect preservation** -- Developer and Agent redirects use a simple `navigate()` that does not leverage the new `post_auth_redirect` localStorage flow

The Agent registration is a single-page form (no wizard steps), so it only needs the auth redirect fix -- no scroll or draft logic needed.

---

### Changes

#### A. Developer Register (`src/pages/developer/DeveloperRegister.tsx`)

**1. Add scroll-to-top on step change**
- Add a `cardRef` (useRef) to the main Card element
- Add a `scrollToWizardTop` callback using `requestAnimationFrame` + `scrollIntoView` with a 100px header offset (same pattern as Agency)
- Add a `useEffect` that calls `scrollToWizardTop` whenever `currentStep` changes
- Also call `scrollToWizardTop()` inside `goNext()` and `goBack()`

**2. Add draft persistence and resume**
- Define a `DRAFT_STORAGE_KEY = 'developer_registration_draft'`
- Define a `DraftData` interface matching the developer form fields + `currentStep` + `savedAt`
- Add a debounced auto-save effect that writes form data and current step to localStorage whenever they change
- On mount (when user is available), check for a saved draft:
  - If found and user has no existing developer profile, show a "Resume where you left off?" prompt
  - If yes, restore formData and currentStep (note: logo file cannot be restored, show "please re-upload logo" if logo_url was set)
  - If no, clear the draft
- Clear the draft on successful submission

**3. Fix auth redirect to use ProtectedRoute pattern**
- The developer register is already wrapped in `ProtectedRoute` in App.tsx, which now appends `role=developer` and the redirect path
- Remove the redundant `useEffect` that manually navigates to `/auth?tab=signup&role=developer` -- ProtectedRoute already handles this
- This ensures the new `post_auth_redirect` localStorage flow kicks in automatically

#### B. Agent Register (`src/pages/agent/AgentRegister.tsx`)

**1. Fix auth redirect**
- The agent register is also wrapped in `ProtectedRoute` in App.tsx
- Remove the redundant `useEffect` that manually navigates to `/auth?tab=signup&role=agent` -- ProtectedRoute handles it with the correct role context and redirect preservation
- No scroll-to-top or draft persistence needed since it is a single-page form (no steps)

---

### Files to modify
- `src/pages/developer/DeveloperRegister.tsx` -- add scroll-to-top, draft persistence, remove redundant auth redirect
- `src/pages/agent/AgentRegister.tsx` -- remove redundant auth redirect (ProtectedRoute handles it)

### What stays the same
- `src/components/shared/ProtectedRoute.tsx` -- already updated with role-based redirect context
- `src/pages/Auth.tsx` -- already handles `redirect` param and `post_auth_redirect` localStorage
- `src/pages/agency/AgencyRegister.tsx` -- already has all safeguards (this is the reference implementation)

