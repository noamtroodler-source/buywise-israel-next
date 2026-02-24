

## Auto-Refresh Import Jobs + Cleanup After Delete

### What's Changing

Two improvements to the import page so everything stays in sync automatically:

1. **Auto-refresh the jobs list** while any job is actively processing or discovering -- so the status badge, processed counts, and total URLs update live without needing a manual page refresh.

2. **Properly clear the UI after deleting** -- when you delete the current/active job, the Step 2 card and stats disappear immediately instead of lingering.

### How It Works

**File: `src/hooks/useImportListings.tsx`**

- Add a `refetchInterval` to `useImportJobs` (same pattern already used in `useImportJobItems`):
  - If any job in the list has status `discovering`, `ready`, or `processing`, poll every 3 seconds
  - Otherwise, stop polling (no unnecessary network requests)
- Also add `refetchInterval` to `useImportJobItems` for the `pending` status too (not just `processing`), so when a batch finishes and items flip from pending to done, the counts update immediately

**File: `src/pages/agency/AgencyImport.tsx`**

- When deleting the active job (the one shown in Step 2), reset `activeJobId` to `null` **and** handle the edge case where `currentJob` falls back to `jobs[0]` even after deletion -- by checking that `currentJob` still exists in the jobs array after the query invalidates
- No visual/design changes needed; existing layout stays the same

### Technical Details

```text
useImportJobs (hook)
  +-- refetchInterval: checks if any job has status
  |   in ['discovering', 'ready', 'processing']
  |   -> 3000ms polling if yes, false if no
  
useImportJobItems (hook)  
  +-- refetchInterval: updated to also poll when
  |   items have status 'pending' (not just 'processing')
  |   -> catches the transition after a batch completes

AgencyImport (page)
  +-- currentJob logic: guard against stale fallback
  |   after deletion by checking jobs array is non-empty
```

This is a small, focused change -- just adding polling logic to one hook and tightening the delete flow. No database changes, no new components.
