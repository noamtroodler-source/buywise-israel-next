

# Remove "Processing" Stat from Import UI

## Change
Drop the "Processing" stat card from the stats grid, keeping only 4 cards: **Imported**, **Skipped**, **Failed**, **Pending**. The "Pending" count will include items currently being processed (pending + processing combined), since from a user perspective they're all just "waiting to be done."

## Technical Details

### File: `src/pages/agency/AgencyImport.tsx`

1. **Stats grid** (line 325): Change `grid-cols-5` back to `grid-cols-4`
2. **Remove Processing entry** (line 331): Delete the `{ label: 'Processing', ... }` object from the array
3. **Merge processing into pending** (line 330): Change `pendingCount` to `pendingCount + processingCount` so items actively processing still show up under "Pending"

That's it -- a 3-line change. The `processingCount` variable can stay defined since it's harmless, or we can leave it for internal use. The UI will just show 4 clean stat cards.
