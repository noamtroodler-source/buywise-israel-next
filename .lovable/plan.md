

## Plan: Add Toast on Glossary Term Save/Unsave

**What:** Add a `sonner` toast notification when a user saves or unsaves a glossary term, matching the existing toast pattern used elsewhere on the platform (bottom-right).

**Change:** `src/pages/Glossary.tsx`
- Import `toast` from `sonner`
- In the `toggleSavedTerm` function, after updating state, show a toast:
  - **Save:** `toast.success('Term saved', { description: 'Quick-access it anytime from the Saved tab.' })`
  - **Unsave:** `toast('Term removed', { description: 'Removed from your saved terms.' })`
- Look up the term's english name from `displayTerms` to personalize the message (e.g., "Land Registry saved")

Single file change, ~5 lines added.

