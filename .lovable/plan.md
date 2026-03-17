
Problem identified

The failures are not primarily a “bad extraction quality” problem anymore. They are failing earlier than that.

What I found
- The current Yad2 job has 128 discovered URLs.
- 24 items have already failed, and every single failed item has the same error:
  - `AI extraction failed (400)`
- Those failed items have `extracted_data = null`, which means the pipeline is failing before any parsed listing is saved.
- Edge logs show:
  - `No extracted data ... scraping individual page`
  - then the whole batch ends with `0 ok, 15 failed`
- So the bottleneck is the Yad2 fallback path inside `processYad2Item`, not discovery, not DB insert, not dedup, and not the “missing city” skip.

Most likely root cause
- There are two different processing pipelines in the function:
  1. the main website pipeline (`processOneItem`) which is more mature
  2. the Yad2-specific fallback pipeline (`processYad2Item`) which duplicates extraction logic
- The Yad2 fallback path is making a direct AI tool-call request that is getting HTTP 400 from the AI gateway.
- Because that branch is thinner and less defensive, it fails immediately instead of:
  - logging the full AI error body
  - retrying with the simplified prompt
  - salvaging partial extraction
  - inferring city from structured/HTML hints
- In short: the Yad2 path has drifted away from the stable pipeline and is now the weak link.

Implementation plan

1. Unify the Yad2 item processing flow
- Refactor `processYad2Item` so it does not maintain its own fragile mini-extraction pipeline.
- Reuse the same proven extraction/retry/merge/validation steps from `processOneItem`.
- Keep only Yad2-specific pieces in the adapter layer:
  - Yad2 discovery
  - optional use of Yad2 coordinates
  - Yad2 import source label

2. Add real AI error observability
- Wherever the AI gateway is called, log the full response text for non-OK responses.
- Store a truncated version of the AI error payload into `error_message` for failed items when safe.
- This will tell us whether the 400 is caused by:
  - oversized prompt
  - invalid tool schema
  - malformed `tool_choice`
  - bad content in scraped markdown
  - unsupported parameter shape

3. Make Yad2 extraction more robust before AI
- On Yad2 item pages, extract obvious structured hints before sending to AI:
  - city
  - title
  - price
  - rooms / size
  - image URLs
- If these fields are present in page HTML or metadata, merge them first to reduce prompt dependence.
- Use Yad2 coordinates if available and preserve them through the unified path.

4. Harden the AI request shape
- Review the exact Yad2 extraction request body against the working AI-tool-call pattern already used elsewhere in the repo.
- Reduce risk of 400s by:
  - sharing one schema builder instead of duplicating tool definitions
  - keeping one canonical `extract_listing` tool schema
  - trimming prompt size more aggressively for Yad2 pages if needed

5. Add recovery for this existing job
- After the code fix, reset only the failed Yad2 items from this job back to `pending`.
- Resume processing instead of rediscovering everything.
- This preserves the 128 discovered URLs and avoids redoing the expensive part.

Why this approach
- The current symptom looks like “all items are being skipped/failed,” but the data shows they are actually failing at the AI request layer.
- Fixing prompts alone may not solve it if the request payload shape is invalid.
- The cleanest world-class fix is to stop maintaining two divergent extraction engines and make Yad2 ride on the reliable one.

Files to update
- `supabase/functions/import-agency-listings/index.ts`

Technical details
- Evidence from database:
  - job `44ae3deb-0f25-4cc7-a25e-60d91ba0217f`
  - `128 total`
  - `24 failed`
  - `104 pending`
  - all failures: `AI extraction failed (400)`
- Evidence from logs:
  - repeated `No extracted data ... scraping individual page`
  - then `Batch: 15 processed (0 ok, 15 failed)`
- Important implication:
  - the earlier “missing city” theory is no longer the main blocker for this batch
  - current blocker is upstream of city validation

Expected result after implementation
- Failed Yad2 items should start producing `extracted_data` instead of dying at HTTP 400.
- Many of the current failed items should become importable without rediscovery.
- Remaining non-importable items should fail for specific, inspectable reasons like:
  - unsupported city
  - duplicate
  - sold/rented
  - genuine validation issue

<lov-actions>
<lov-suggestion message="Test the Yad2 import flow end-to-end again after the fix, including retrying the failed batch and confirming listings actually move from pending to imported.">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the refactor to unify the Yad2 processing path with the main import pipeline and add detailed AI error logging so 400 responses become diagnosable.">Refactor Yad2 processing</lov-suggestion>
<lov-suggestion message="Add an admin import diagnostics view that shows per-item failure reasons, raw AI error snippets, and retry actions for failed imports.">Add import diagnostics</lov-suggestion>
<lov-suggestion message="Add a dry-run preview mode that extracts listing data without inserting properties, so you can inspect Yad2 parsing quality before processing full batches.">Add dry-run preview</lov-suggestion>
</lov-actions>
