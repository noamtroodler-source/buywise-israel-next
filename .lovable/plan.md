

# Phase 8: Job Timeout & Resume

## Overview

Add 30-minute timeout detection for stalled import jobs and a "Resume" button so admins can restart processing. The timeout is detected client-side by comparing `updated_at` against current time — no cron job needed.

## Database Change

Add a `last_heartbeat` column to `import_jobs` to track when the job was last actively processing:

```sql
ALTER TABLE public.import_jobs ADD COLUMN last_heartbeat timestamptz;
```

## Changes

### 1. Edge function: heartbeat + stall detection

In `handleProcessBatch` in `import-agency-listings/index.ts`:
- Set `last_heartbeat = now()` when batch starts (alongside `status = 'processing'`)
- Update `last_heartbeat` after each chunk completes
- Add a new action `resume_job` that resets any `processing` items back to `pending` and sets job status to `ready`

### 2. Client-side timeout detection

In `AgencyImport.tsx`:
- Check if `currentJob.status === 'processing'` and `updated_at` is older than 30 minutes
- If so, show a "Stalled" badge and a "Resume" button
- The Resume button calls the new `resume_job` action

### 3. New hook: `useResumeJob` in `useImportListings.tsx`

```typescript
export function useResumeJob() {
  // Calls edge function with action: 'resume_job', job_id
  // Resets stuck 'processing' items to 'pending'
  // Sets job status back to 'ready'
}
```

### 4. UI in `AgencyImport.tsx`

- When job is stalled (processing + last update > 30min): show amber "Stalled" badge
- Show "Resume Import" button that invokes `resume_job`
- Toast: "Job resumed — X items reset for reprocessing"

## Files
- **Migration**: Add `last_heartbeat` column to `import_jobs`
- **Edit**: `supabase/functions/import-agency-listings/index.ts` — heartbeat updates + `resume_job` action
- **Edit**: `src/hooks/useImportListings.tsx` — add `useResumeJob` mutation
- **Edit**: `src/pages/agency/AgencyImport.tsx` — stall detection UI + Resume button

