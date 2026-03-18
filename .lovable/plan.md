

## Add Saves Count to Project Pages

The project page already shows "34 views" (Eye icon) in the Activity Indicators section. We need to add a saves count next to it.

### What exists
- `projects` table already has a `total_saves` column (integer, default 0) with a trigger that increments it on `project_favorites` insert
- The `ProjectQuickSummary` component already renders `views_count` with an Eye icon (lines 152-158)
- `Heart` is already imported but unused in this component

### Changes

**`src/components/project/ProjectQuickSummary.tsx`** — Add saves display next to views in the Activity Indicators section:
- Add `{project.total_saves || 0} saves` with a Heart icon, matching the views pattern
- The `Project` type in `types/projects.ts` may need `total_saves` added — need to check if it's in the Supabase types already

**`src/types/projects.ts`** — If `total_saves` isn't in the `Project` interface, add it as an optional `number` field.

**Ensure data flows through** — Check that the project detail page query fetches `total_saves` (it likely does via `select('*')`).

This is a small change: just one line of JSX added to the activity indicators div, mirroring the existing views pattern.

