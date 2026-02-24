

# Incremental Re-Import

## What It Does
When an agency re-runs discovery on the same website URL, instead of blocking them ("A job for this URL already exists"), the system will:
1. Re-scan the website for all URLs
2. Compare against URLs already in ANY previous job for that agency + URL combo
3. Only create new job items for URLs that haven't been seen before
4. Skip all the filtering/classification/scraping for already-known URLs

This means agencies can periodically re-import to pick up new listings without re-processing their entire site.

## Current Behavior
- **Backend**: If a non-failed job exists for the same `agency_id + website_url`, it returns `resumed: true` and does nothing new
- **Frontend**: Client-side check also blocks submission if a matching URL job exists

## Changes

### 1. Backend: `handleDiscover` (edge function)
Instead of blocking on duplicate jobs, the new flow:
1. Run Firecrawl map as usual to get fresh URL list
2. Query ALL `import_job_items` URLs from previous jobs for this `agency_id + website_url` (across all past jobs, not just the latest)
3. Also check the `properties` table for `source_url` matches (catches listings imported from older deleted jobs)
4. Filter out already-known URLs before AI classification
5. If zero new URLs found, return early with a clear message: `{ new_urls: 0, total_discovered: X }`
6. If new URLs exist, create a NEW job (not reuse the old one) with only the new items

This approach is clean because:
- Each job is a self-contained unit with its own progress tracking
- Past job history is preserved
- The "Past Imports" UI continues to work naturally

### 2. Frontend: Remove client-side duplicate block
The `AgencyImport.tsx` currently short-circuits if it finds an existing job with the same URL (line 69-75). Remove this block so the request reaches the backend, which handles the incremental logic.

Update the discovery success toast to show how many NEW URLs were found vs. how many were skipped as already imported.

### 3. Frontend: UI feedback for incremental results
When discovery returns with `new_urls: 0`, show a friendly message like "Your site is up to date - no new listings found." instead of creating an empty job.

## Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No previous jobs for this URL | Normal full discovery (unchanged) |
| Previous job exists, all URLs already known | Returns `{ new_urls: 0 }`, no new job created |
| Previous job exists, some new URLs found | Creates new job with only new URLs |
| Previous job was deleted but listings remain in `properties` | `source_url` check catches these too |
| Agency re-imports after deleting all old jobs | Falls through to normal full discovery |
| URL normalization differences | Uses existing `normalizeUrl()` for consistent matching |

## Technical Details

**File: `supabase/functions/import-agency-listings/index.ts`**
- Rewrite the duplicate-check block in `handleDiscover` (lines 600-623)
- After Firecrawl map + filtering + AI classification, subtract known URLs
- Add `source_url` lookup from `properties` table as secondary dedup
- Return response with `new_urls` count and `skipped_existing` count

**File: `src/pages/agency/AgencyImport.tsx`**
- Remove client-side duplicate URL block (lines 68-75)
- Update toast messages to reflect incremental results
- Handle `new_urls: 0` response with an informational message instead of switching to a job

**File: `src/hooks/useImportListings.tsx`**
- Update `useDiscoverListings` return type to include `new_urls` and `skipped_existing`

