

## Plan: Add Scroll-to-Top on Every Wizard Step Change

### Problem
Several wizards don't scroll to top when navigating between steps — particularly when using direct step clicks (`setCurrentStep`) or in wizards that lack `window.scrollTo` calls entirely.

### Wizards Affected

| Wizard | `goNext`/`goBack` scroll | `setCurrentStep` click scroll |
|--------|------------------------|------------------------------|
| PropertyWizardContext | ✅ Has it | ❌ Missing |
| ProjectWizardContext (developer) | ❌ Missing | ❌ Missing |
| AgentRegisterWizard | ❌ Missing | ❌ Missing |
| MortgageWizard | ❌ Missing | N/A (no step clicks) |
| DeveloperRegister | ✅ Has `scrollToWizardTop` | ✅ Has it |

### Changes

**1. `PropertyWizardContext.tsx`** — Wrap `setCurrentStep` so it always scrolls to top. Replace the raw `useState` setter exposed in context with a wrapper that calls `window.scrollTo({ top: 0, behavior: 'smooth' })` after setting the step. This covers both `onStepClick` from `WizardProgress` and `onEditStep` from `StepReview`.

**2. `ProjectWizardContext.tsx`** (developer wizard) — Same pattern: add `window.scrollTo` to `goNext`, `goBack`, and wrap `setCurrentStep`.

**3. `AgentRegisterWizard.tsx`** — Add `window.scrollTo({ top: 0, behavior: 'smooth' })` to `goNext` and `goBack` functions.

**4. `MortgageWizard.tsx`** — Add scroll-to-top when step changes via the next/back buttons.

### Technical Approach
For the context-based wizards (Property, Project), create a `handleSetCurrentStep` wrapper:
```ts
const handleSetCurrentStep = useCallback((step: number) => {
  setCurrentStep(step);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}, []);
```
Expose this wrapper as `setCurrentStep` in the context value. For standalone wizards (AgentRegister, Mortgage), add the scroll call inline in `goNext`/`goBack`.

