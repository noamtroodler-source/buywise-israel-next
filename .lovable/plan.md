

# Progress ETA for Import Processing

## What It Does
While listings are being imported, show an estimated time remaining based on the average processing speed observed so far. This gives agencies a clear sense of how long they'll need to wait.

## Placement
Inside the **"Auto-import active" indicator** (the blue pulsing banner at lines 247-272) -- this is the natural place since it only appears during active processing and already shows live counts. The ETA will appear as an additional line of text below the existing "X imported / Y skipped / Z remaining" line.

When not actively auto-importing (e.g. between manual batches), the ETA won't show -- there's no meaningful speed to measure.

## Design
The ETA will appear as a subtle line within the existing processing indicator:

```
[spinner] Importing listings...
           12 imported · 3 skipped · 25 remaining
           ~8 min remaining (avg 18s per listing)
```

- Uses `text-xs text-muted-foreground` to keep it secondary to the main counts
- Shows both the time estimate AND the per-item speed for transparency
- Gracefully handles edge cases (shows "Calculating..." until at least 2 items are done)

## How It Works
Track two values via `useRef` in the `useProcessAll` hook:
1. `startTimeRef` -- timestamp when processing started
2. `processedSoFarRef` -- count of items processed so far (succeeded + failed)

Expose these as return values. The UI component calculates:
```
avgTimePerItem = elapsed / processedSoFar
estimatedRemaining = avgTimePerItem * pendingCount
```

## Technical Details

### File: `src/hooks/useImportListings.tsx`
- Add `startTimeRef` and `processedCountRef` refs to `useProcessAll`
- Set `startTimeRef` at the start of `startProcessAll`
- Update `processedCountRef` after each batch
- Return `{ processingStartTime, processedSoFar }` alongside existing values

### File: `src/pages/agency/AgencyImport.tsx`
- Destructure new values from `useProcessAll`
- Add a small `useEffect` + `useState` that recalculates the ETA every 3 seconds (to keep the display updating smoothly even between batch completions)
- Render the ETA line inside the `isProcessingAll` motion div, below the existing counts
- Format time as "~Xm Ys remaining" or "less than a minute" for small values
- Show "Calculating..." until at least 2 items have been processed (need enough data for a meaningful average)

