
# Smart Retry Classification

## Overview
Currently, the "Retry Failed" button resets ALL failed and skipped items back to pending — even permanent failures like 404s, duplicate listings, "not a listing" pages, and project pages. This wastes Firecrawl credits and AI calls re-processing items that will always fail.

The fix introduces error classification at every failure point, then uses that classification to only retry transient failures.

## How It Works

### 1. Add `error_type` column to `import_job_items`
A new text column that tags each failure as one of:
- **`transient`** — Timeouts, rate limits, network errors, scrape failures (5xx). Worth retrying.
- **`permanent`** — 404s, paywalls, validation errors, duplicates, "not a listing", project pages, sold/rented. Will never succeed.

Default: `null` (for pending/done items).

### 2. Tag every failure point in `processOneItem`
Go through every `status: "failed"` or `status: "skipped"` update in the edge function and add the appropriate `error_type`:

| Failure | Error Type |
|---------|-----------|
| URL duplicate, in-job duplicate, address/fuzzy duplicate | `permanent` |
| Pre-check 404, redirect off-domain | `permanent` |
| Pre-check network error, timeout | `transient` |
| Scrape 404/410 | `permanent` |
| Scrape other failures (5xx, network) | `transient` |
| AI rate limit (429) | `transient` |
| AI extraction failed (other status) | `transient` |
| AI returned no data | `permanent` |
| Not a listing / project page | `permanent` |
| City not supported | `permanent` |
| Sold/rented | `permanent` |
| Validation errors | `permanent` |
| Property insert failed | `transient` |
| Content too short | `permanent` |
| Catch-all exceptions | `transient` (default to retryable) |

### 3. Update `handleRetryFailed` to only reset transient errors
Change the retry query filter from `in("status", ["failed", "skipped"])` to also require `eq("error_type", "transient")`.

### 4. Update the UI
- The "Retry Failed" button label changes to "Retry (X)" showing only the transient failure count
- Disable the button when there are zero transient failures
- Show separate counts: "3 retryable, 12 permanent" so agencies understand what's happening

### 5. Update the hook
Add `retry_failed` action response to include `transient_count` and `permanent_count` for better UI feedback.

## Technical Details

**Database migration:** Add column `error_type text` to `import_job_items` (nullable, no constraint).

**Files changed:**
- `supabase/functions/import-agency-listings/index.ts` — Add `error_type` to every failure update call (~15 locations)
- `src/hooks/useImportListings.tsx` — Update `useRetryFailed` response type
- `src/pages/agency/AgencyImport.tsx` — Show smart retry counts, update button label
