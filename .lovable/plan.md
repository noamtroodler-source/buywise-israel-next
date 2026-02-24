
## Retry Failed Import Items

### What This Adds

A "Retry Failed" button that resets all failed/skipped items back to "pending" so they can be re-processed in the next batch -- without re-running discovery or re-importing items that already succeeded.

### Changes

**1. Edge Function: `supabase/functions/import-agency-listings/index.ts`**

Add a new `retry_failed` action handler that:
- Takes a `job_id` parameter
- Updates all items with status `failed` or `skipped` back to `pending`
- Resets their `error_message` to null
- Sets the job status back to `ready` so the "Import Next Batch" button appears
- Returns the count of items reset

**2. Hook: `src/hooks/useImportListings.tsx`**

Add a new `useRetryFailed` mutation that:
- Calls the edge function with `action: 'retry_failed'`
- Shows a toast with how many items were reset
- Invalidates the import jobs and items queries so the UI refreshes

**3. UI: `src/pages/agency/AgencyImport.tsx`**

Add a "Retry Failed" button in the action buttons area that:
- Only appears when there are failed/skipped items (`failedCount > 0`)
- Shows a retry icon with the count of failed items
- Disables while the retry mutation is running
- Sits alongside the existing "Import Next Batch" and "View Imported Drafts" buttons

### Technical Details

```text
Edge Function (new action: retry_failed)
  1. Validate job_id
  2. UPDATE import_job_items SET status='pending', error_message=NULL
     WHERE job_id = ? AND status IN ('failed', 'skipped')
  3. UPDATE import_jobs SET status='ready' WHERE id = ?
  4. Return { reset_count: N }

Hook (useRetryFailed)
  - mutationFn: invoke('import-agency-listings', { action: 'retry_failed', job_id })
  - onSuccess: toast + invalidate queries

UI (AgencyImport)
  - New button: "Retry Failed (N)" with RefreshCw icon
  - Condition: failedCount > 0
  - Matches existing button styling (rounded-xl, outline variant)
```

No database migrations needed -- the existing `import_job_items` table already has the `status` and `error_message` columns.
