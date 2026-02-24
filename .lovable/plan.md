

## "Import All" Auto-Batching + Background Completion Notifications

### Problem
Users with many listings (e.g. 280) must click "Import Next Batch" 28 times manually. If they navigate away during import, they get no notification when it finishes.

### Solution
1. Add a **"Process All Remaining"** button that chains batch calls automatically on the frontend
2. Show a **toast notification** when the import completes, even if the user navigated away from the import page

### Changes

**File: `src/hooks/useImportListings.tsx`**

Add a new `useProcessAll` hook that:
- Accepts a `jobId`
- Calls `process_batch` in a loop until `remaining === 0`
- Tracks state: `isProcessingAll`, `stopRequested`
- Exposes a `stop()` function so the user can cancel the auto-batching
- On completion (remaining === 0), shows a persistent toast: "Import complete! X listings imported as drafts"
- On error, stops the loop and shows the error toast
- Invalidates queries after each batch (so the progress bar updates live)

```text
export function useProcessAll() {
  const queryClient = useQueryClient();
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const stopRef = useRef(false);

  const startProcessAll = async (jobId: string) => {
    setIsProcessingAll(true);
    stopRef.current = false;
    let totalSucceeded = 0;
    let totalFailed = 0;

    try {
      while (!stopRef.current) {
        const { data, error } = await supabase.functions.invoke(
          'import-agency-listings',
          { body: { action: 'process_batch', job_id: jobId } }
        );
        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        totalSucceeded += data.succeeded;
        totalFailed += data.failed;

        // Refresh UI after each batch
        queryClient.invalidateQueries({ queryKey: ['importJobs'] });
        queryClient.invalidateQueries({ queryKey: ['importJobItems'] });

        if (data.remaining === 0 || data.status === 'completed') break;
      }

      queryClient.invalidateQueries({ queryKey: ['agencyListingsManagement'] });

      if (stopRef.current) {
        toast.info(`Import paused. ${totalSucceeded} imported, ${totalFailed} skipped/failed so far.`);
      } else {
        toast.success(
          `Import complete! ${totalSucceeded} listings imported, ${totalFailed} skipped/failed.`,
          { duration: 10000 }
        );
      }
    } catch (err) {
      toast.error(`Import failed: ${err.message}`);
    } finally {
      setIsProcessingAll(false);
    }
  };

  const stopProcessAll = () => { stopRef.current = true; };

  return { startProcessAll, stopProcessAll, isProcessingAll };
}
```

Key design decisions:
- Uses `useRef` for the stop flag so it's immediately visible in the async loop (no stale closure)
- No `useState` import needed -- it's already imported in the file... actually needs `useState` and `useRef` from React
- Toast `duration: 10000` (10 seconds) for the completion notification so the user notices it even if they're on another page
- Each batch invalidates queries so the progress bar, stats, and status badge update in real-time

**File: `src/pages/agency/AgencyImport.tsx`**

1. Import `useProcessAll` from the hooks file
2. Initialize the hook in the component
3. Add a "Process All Remaining" button next to the existing "Import Next Batch" button
4. When `isProcessingAll` is true, show a "Stop" button instead
5. Disable the single-batch button while auto-batching is active

Updated action buttons section:

```text
{(isReady || (isCompleted && pendingCount > 0)) && (
  <>
    {/* Single batch button */}
    <Button
      onClick={handleProcessBatch}
      disabled={isProcessing || isProcessingAll}
      variant="outline"
      className="rounded-xl"
    >
      ...existing content...
    </Button>

    {/* Process All / Stop button */}
    {isProcessingAll ? (
      <Button
        onClick={stopProcessAll}
        variant="destructive"
        className="rounded-xl"
      >
        <XCircle className="h-4 w-4 mr-2" />
        Stop Import
      </Button>
    ) : (
      <Button
        onClick={() => startProcessAll(currentJob!.id)}
        disabled={isProcessing}
        className="rounded-xl"
      >
        <Download className="h-4 w-4 mr-2" />
        Import All Remaining ({pendingCount} listings)
      </Button>
    )}
  </>
)}
```

Design changes:
- "Import All Remaining" becomes the primary (default variant) button
- "Import Next Batch" becomes secondary (outline variant)
- During auto-batching, a red "Stop Import" button replaces "Import All"
- The processing spinner shows on the progress bar area (already works via polling)
- The `isProcessing` state derived from `processBatchMutation.isPending || currentJob?.status === 'processing'` is updated to also include `isProcessingAll`

### Background Notifications
The toast with `duration: 10000` from `sonner` will show even if the user navigated to a different page (e.g. /agency/listings), because `sonner`'s `<Toaster>` is mounted at the app layout level. No additional infrastructure needed -- the toast just fires from the async loop when it completes.

### No Backend Changes
The edge function already processes batches of 10 and returns `remaining` count. The frontend simply chains these calls. No new edge function action needed.

### Files Modified
- `src/hooks/useImportListings.tsx` -- add `useProcessAll` hook
- `src/pages/agency/AgencyImport.tsx` -- add "Import All" / "Stop" buttons, wire up the hook
