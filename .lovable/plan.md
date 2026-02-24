

# "First Batch" vs "Next Batch" Label

## Change
When no items have been processed yet (imported + skipped + failed = 0), the batch button should say **"First Batch (9)"**. After any items have been processed, it switches to **"Next Batch (9)"**.

## Technical Details

### File: `src/pages/agency/AgencyImport.tsx` (line 385)

Change:
```
Next Batch ({Math.min(pendingCount, 9)})
```
To:
```
{doneCount + skippedCount + failedCount > 0 ? 'Next' : 'First'} Batch ({Math.min(pendingCount, 9)})
```

That's a single line change. The variables `doneCount`, `skippedCount`, and `failedCount` are already defined above in the component.

