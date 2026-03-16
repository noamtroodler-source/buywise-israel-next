

# Phase 7: Real-time Progress Tracking

## Overview

Replace the current 3-second polling on `import_jobs` and `import_job_items` with Supabase Realtime subscriptions. Build a dedicated progress bar component showing "47/156 listings · 30%" with ETA.

## Database Change

Enable Realtime on both tables:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.import_job_items;
```

## Changes

### 1. New hook: `src/hooks/useRealtimeImportProgress.ts`

A focused hook that:
- Subscribes to `postgres_changes` on `import_job_items` filtered by `job_id`
- Subscribes to `postgres_changes` on `import_jobs` filtered by `id`
- On any INSERT/UPDATE event, invalidates the relevant React Query cache keys (`importJobs`, `importJobItems`)
- Cleans up channel on unmount
- This replaces the `refetchInterval` polling in both `useImportJobs` and `useImportJobItems`

```typescript
export function useRealtimeImportProgress(jobId: string | undefined) {
  // Subscribe to import_job_items changes for this job
  // Subscribe to import_jobs changes for this job
  // Invalidate queries on any change
}
```

### 2. New component: `src/components/agency/ImportProgressBar.tsx`

A self-contained progress bar component that displays:
- **Progress text**: "47/156 listings · 30%"
- **Visual progress bar** with animated indicator during active processing
- **ETA calculation** based on elapsed time and processed count (reuses existing `formatEta` logic)
- **Status breakdown**: "32 imported · 10 skipped · 5 failed · 109 remaining"
- **Speed indicator**: "avg 8s per listing"

Props: `{ totalItems, doneCount, skippedCount, failedCount, pendingCount, processingCount, startTime, processedSoFar, isActive }`

### 3. Update `src/hooks/useImportListings.tsx`

- Remove `refetchInterval` from both `useImportJobs` and `useImportJobItems` — realtime handles this now
- Keep the queries themselves unchanged

### 4. Update `src/pages/agency/AgencyImport.tsx`

- Import and call `useRealtimeImportProgress(currentJob?.id)` to activate the realtime subscription
- Replace the inline progress bar section (lines 396-407) and the auto-import indicator (lines 368-394) with the new `ImportProgressBar` component
- Remove the inline `ImportEta` component (lines 44-65) — now part of `ImportProgressBar`
- Remove the `formatEta` function (lines 32-42) — moved into the new component

### 5. Update `src/pages/agency/AgencyImportReview.tsx`

- Import and call `useRealtimeImportProgress(jobId)` so the review page also gets live updates without polling

## Files
- **Migration**: Enable realtime on `import_jobs` and `import_job_items`
- **Create**: `src/hooks/useRealtimeImportProgress.ts`
- **Create**: `src/components/agency/ImportProgressBar.tsx`
- **Edit**: `src/hooks/useImportListings.tsx` — remove refetchInterval
- **Edit**: `src/pages/agency/AgencyImport.tsx` — use realtime hook + new progress component
- **Edit**: `src/pages/agency/AgencyImportReview.tsx` — use realtime hook

