
Goal: make Madlan actually produce listings reliably, and prove it with a fast end-to-end smoke test that imports at least 1 property before we consider the fix done.

What I found
- All 55 Madlan sources are still dead: `agency_sources.last_sync_listings_found = 0`, `import_jobs.total_urls = 0`, and there are `0` Madlan `import_job_items` and `0` Madlan properties in the database.
- The current discovery logic is still the core problem. Stored source URLs are in the form:
  `https://www.madlan.co.il/agentsOffice/re_office_*`
  but the scraper rewrites them into discovery pages like:
  `https://www.madlan.co.il/for-sale/israel--office--re_office_*`
  which do not expose listing URLs.
- I fetched example Madlan pages and the rewritten paths return generic marketplace content with no `/listing/` links, so jobs finish as “completed” with zero results instead of failing loudly.
- Secondary issue: the admin UI still hints Madlan inputs should be `/for-sale/israel--office--...`, which reinforces the wrong format.

Implementation plan

1. Fix Madlan URL normalization at the source
- Replace the current Madlan discovery URL builder with a proper normalizer that supports:
  - `/agentsOffice/re_office_*`
  - `/for-sale/agentsOffice/re_office_*`
  - `/for-rent/agentsOffice/re_office_*`
  - already-normalized office/agent paths if valid
- Build the canonical discovery URL from the actual office route format instead of inventing `israel--office--...` slugs.
- Preserve sale/rent mode switching without breaking the office identifier.

2. Add hard validation so bad Madlan routes fail loudly
- Before declaring discovery “completed”, validate that the fetched page is really an office results page.
- Detect “generic Madlan shell” pages by checking for absence of listing signals and presence of broad marketplace/navigation-only content.
- If the page is invalid or empty, mark the job as `failed` instead of `completed`, and write a useful `last_failure_reason` on the matching source.
- This prevents silent 0-result false positives.

3. Strengthen listing extraction for Madlan
- Expand extraction beyond the current narrow `/listing/` regexes.
- Parse links and structured data from rendered HTML more defensively.
- Add a small discovery fallback order:
  1) canonical office page
  2) same office page with sale/rent variant
  3) original raw source URL if canonicalized page yields no listing signals
- Deduplicate normalized listing URLs before enqueueing items.

4. Add a fast smoke-test path for Madlan
- Add focused tests for the Madlan normalizer and extractor using real captured HTML fixtures from successful office pages.
- Add one manual smoke-test workflow for implementation verification:
  - trigger discovery on one known Madlan office
  - confirm `import_job_items > 0`
  - run `process_batch`
  - confirm at least one property is created with `import_source = 'madlan'`
- If needed, add a temporary debug response/logging around discovered page type and listing count so verification is unambiguous.

5. Fix the admin input guidance so operators use the right format
- Update the admin import placeholder/help text for Madlan to prefer the actual supported office URL format.
- Optionally normalize pasted Madlan URLs client-side before invoking discovery, so admins can paste older variants and still get the canonical route.

6. Repair existing dead Madlan sources after code fix
- Re-run a sample source first to validate the pipeline.
- Then re-run the broader Madlan source set.
- Update failed/empty sources with clearer statuses based on the new validation logic so we can distinguish:
  - invalid office URL
  - bot/captcha block
  - no listings on source
  - extraction failure

Definition of done
- A Madlan smoke test successfully discovers and imports at least 1 property.
- Madlan jobs no longer end as `completed` with `total_urls = 0` unless the source is explicitly validated as having no listings.
- Source records show actionable failure reasons instead of silent zeroes.
- Admin UI points users to the correct Madlan URL shape.

Technical notes
- Main file to change: `supabase/functions/import-agency-listings/index.ts`
- Likely UI touchpoints:
  - `src/pages/admin/AdminAgencyImport.tsx`
  - possibly `src/pages/admin/AdminScrapingSources.tsx`
- No schema change is required unless we decide to add structured Madlan diagnostics fields; this can likely be done without database changes.
- I will verify using the deployed backend function directly and database reads, not just code inspection.

<lov-actions>
<lov-suggestion message="Test the Madlan import end-to-end after the fix and verify that at least one property is discovered and imported successfully">Verify that it works</lov-suggestion>
<lov-suggestion message="Implement the full Madlan discovery fix, add validation for invalid office pages, and run a smoke test that imports at least one Madlan property">Fix Madlan scraping</lov-suggestion>
<lov-suggestion message="Add automated edge-function tests and HTML fixtures for Madlan URL normalization and listing extraction so this does not break again">Add Madlan tests</lov-suggestion>
<lov-suggestion message="Improve the admin import UI to normalize Madlan URLs automatically and show clearer source-specific guidance and error states">Improve admin import UX</lov-suggestion>
</lov-actions>
