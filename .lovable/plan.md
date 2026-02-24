

# Split "Failed" into "Skipped" vs "Failed" in Import UI

## Problem
The import page shows all non-successful items as "Failed", making it look like something went wrong. In reality, most are intentional skips (duplicates, sold/rented, unsupported city, not a listing page) -- not errors.

## What Changes

### 1. Separate the counts (AgencyImport.tsx)

Split the current combined `failedCount` into two distinct counts:
- **`skippedCount`** -- items with `status === 'skipped'` (duplicates, sold/rented, not a listing, unsupported city, projects)
- **`failedCount`** -- items with `status === 'failed'` (actual errors: scrape failures, AI extraction failures, validation errors)

### 2. Update the stats grid from 4 columns to 5

```text
 Imported | Skipped | Failed | Pending | Processing
   12         4         1        25         3
```

- **Skipped**: gray/neutral icon (a "skip forward" or "minus circle" icon), `text-muted-foreground`
- **Failed**: keeps the red XCircle icon (only shows real errors now)

### 3. Update the auto-import banner text

Change from:
> 12 imported . 4 skipped . 25 remaining

To:
> 12 imported . 3 skipped . 1 failed . 25 remaining

(Only show the "failed" segment if failedCount > 0)

### 4. Update progress calculation

The progress bar already counts both as "processed" -- no change needed there. Just update the label text to say `doneCount + skippedCount + failedCount` of `totalItems`.

### 5. Retry button logic

The retry button already checks `transientCount` (which is only on actual `failed` items). This stays the same -- only real failures with `error_type: 'transient'` can be retried.

### 6. Completion message

Update the completion banner to mention skipped items:
> Import complete! 12 listings imported, 4 skipped, 1 failed.

## Technical Details

### File: `src/pages/agency/AgencyImport.tsx`

**Counts (lines ~142-149):**
- Add `skippedCount = jobItems.filter(i => i.status === 'skipped').length`
- Change `failedCount` to only count `status === 'failed'`
- Update `transientCount` and `permanentCount` to only look at `status === 'failed'`
- Adjust `progressPercent` denominator: `doneCount + skippedCount + failedCount`

**Stats grid (lines ~324-340):**
- Change from 4 columns (`grid-cols-4`) to 5 columns (`grid-cols-5`)
- Add "Skipped" stat with a neutral gray icon (e.g., `AlertCircle` or a `MinusCircle` from lucide)
- Keep "Failed" with red icon but it will now only show real errors

**Auto-import banner (line ~295):**
- Update text to: `{doneCount} imported . {skippedCount} skipped{failedCount > 0 ? ` . ${failedCount} failed` : ''} . {pendingCount} remaining`

**Completion banner (lines ~427-433):**
- Update to show skipped and failed separately

**Import for icon:**
- Add `SkipForward` or `MinusCircle` from lucide-react for the skipped stat

No backend changes needed -- the edge function already correctly sets `status: 'skipped'` vs `status: 'failed'`.

