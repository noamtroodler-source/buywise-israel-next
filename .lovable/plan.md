

## Plan: Guarantee Scroll-to-Top on Every Wizard Step Change

### Problem
All wizard contexts use `window.scrollTo({ top: 0, behavior: 'smooth' })` in `goNext`, `goBack`, and `setCurrentStep`. The `smooth` behavior can be interrupted by React re-renders that happen simultaneously with the step change, causing the page to stay mid-scroll.

### Solution
Replace all `window.scrollTo({ top: 0, behavior: 'smooth' })` calls in wizard navigation with a reliable `requestAnimationFrame` + `instant` scroll pattern. This ensures the scroll fires after React has committed the DOM update.

Create a shared utility and use it everywhere:

**1. New utility — `src/lib/scrollToTop.ts`**
- Export a helper: `scrollToTopInstant()` that uses `requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }))`

**2. Update `PropertyWizardContext.tsx`** (agent/agency property wizards)
- Replace 3 `window.scrollTo` calls in `goNext`, `goBack`, `handleSetCurrentStep` with the new utility

**3. Update `ProjectWizardContext.tsx`** (developer/agency project wizards)
- Replace 3 `window.scrollTo` calls in `goNext`, `goBack`, `handleSetCurrentStep`

**4. Update `BlogWizardContext.tsx`**
- Replace 2 `window.scrollTo` calls in `goNext`, `goBack`

**5. Update `AgentRegisterWizard.tsx`**
- Replace 2 `window.scrollTo` calls in `goNext`, `goBack`

**6. Update `MortgageWizard.tsx`**
- Replace 2 inline `window.scrollTo` calls in button onClick handlers

Registration wizards (`AgencyRegister.tsx`, `DeveloperRegister.tsx`) already use a robust `scrollToWizardTop` with `requestAnimationFrame` — those are fine.

**Total: 6 files, ~12 scroll call replacements, 1 new tiny utility file.**

