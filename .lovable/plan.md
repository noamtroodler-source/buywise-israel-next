Plan: Make Madlan imports active-only, image-aware, and safe

Goal
Fix the current Erez import problem and harden the pipeline so Madlan can never again create hundreds of stale/hidden listings when the public page only shows a small active count. Madlan photos remain allowed as fallback. Yad2 photos remain blocked.

Current diagnosis
- Erez Madlan public page shows 36 active listings: 25 sale, 11 rent.
- Database has 593 Madlan-imported Erez rows.
- Only 8 of those 593 Madlan rows have images, even though the public Madlan cards visibly have photos.
- Erez website import is working better: website rows have images.
- Therefore the Madlan importer is over-collecting candidates and under-extracting images.

Immediate cleanup plan
1. Quarantine the bad Madlan batch
   - Do not publish the 593 Madlan rows.
   - Mark the existing Erez Madlan rows as requiring review / quarantined, or delete only those bad Madlan rows if we confirm they are not needed.
   - Keep Erez own-website listings because those are the trusted first-party source and already include images.

2. Preserve any useful website/import data
   - Keep all website_scrape listings and their stored images.
   - Do not touch Yad2 rows unless they were queued but not imported.
   - Avoid deleting anything from the agency website source.

3. Re-run Madlan only after the importer is fixed
   - Re-import only the public active Madlan listings.
   - Expected target should be near 36, not 593.
   - Any count mismatch should block the import and show a warning instead of inserting rows.

Future-proof importer changes
1. Add a Madlan active-count gate
   - Parse the public Madlan office page active counts: sale count + rent count.
   - Use that as the expected maximum import count.
   - If discovered candidates are far above the public active count, stop the job before inserting.
   - Example: public active count = 36, discovered candidates = 593 → block import.

2. Restrict discovery to active listings only
   - Only crawl/parse the active properties section.
   - Exclude transaction history, broker database, team/about/review tabs, archived records, and hidden stale listing payloads.
   - Sale and rent should be handled explicitly as two active buckets.

3. Confirm each Madlan listing before insert
   For each candidate listing, verify:
   - belongs to Erez Real Estate or the selected agency,
   - is currently active/public,
   - is for sale or for rent,
   - has a usable address/area/price signal,
   - has a canonical listing URL,
   - has images or is flagged as image extraction failed.

4. Fix Madlan image extraction
   - Extract image URLs from the visible cards and/or listing detail pages.
   - Support lazy-loaded sources such as srcset, data-src, background-image, JSON embedded state, and nested image objects.
   - Normalize relative/proxy URLs into absolute URLs.
   - Download allowed Madlan images into our property image storage for Madlan-only fallback listings.
   - Do not overwrite agency website images with Madlan images.

5. Add strict source-aware image rules
   - Agency website: preferred image source, can overwrite empty image arrays.
   - Madlan: allowed fallback only when no agency website images exist.
   - Yad2: never store images.

6. Add pre-insert validation
   Before inserting a Madlan row, require:
   - active listing confirmation,
   - valid source URL,
   - sane price/transaction type,
   - duplicate check against existing website/Madlan rows,
   - image extraction result recorded as success/warning/failure.

7. Add duplicate/merge protection
   - Match Madlan rows against existing website listings by address, city, price, size, rooms, and source URLs.
   - If a website listing already exists, merge the Madlan source URL but keep website photos.
   - If Madlan-only listing exists and no website match exists, create it with Madlan fallback photos.

Admin UI improvements
1. Show expected vs discovered count
   Add diagnostics to the agency provisioning screen:
   - Madlan public active count
   - discovered candidates
   - accepted active listings
   - rejected stale/hidden listings
   - image success count
   - image extraction failure count

2. Block dangerous imports visibly
   If the public count is 36 and the importer discovers 593, show:
   “Blocked: Madlan reports 36 active listings, but 593 candidates were discovered. No rows inserted.”

3. Add cleanup/retry actions
   Add admin actions:
   - Quarantine current bad Madlan rows
   - Retry Madlan active-only import
   - Retry image extraction for Madlan rows missing images
   - View rejected reasons

Technical implementation details
- Update `supabase/functions/import-agency-listings/index.ts`:
  - add Madlan active-count parsing,
  - add candidate filtering by active tab/section,
  - add pre-insert validation,
  - improve image extraction from card/detail/embedded data,
  - add count mismatch blocking,
  - add structured diagnostics in `failure_reason` or job metadata.

- Update admin hooks/components:
  - `src/hooks/useImportListings.tsx`
  - `src/components/admin/agency-provisioning/ImportListingsSection.tsx`
  - expose expected/accepted/rejected/image metrics,
  - add quarantine/retry actions.

- Database/data operations:
  - Use data update tooling for cleanup of the current Erez Madlan rows.
  - Use schema migration only if we need new persistent diagnostic columns/tables.
  - Prefer reusing `import_jobs.failure_reason` for structured JSON diagnostics if sufficient.

Validation checklist
1. Erez Madlan import should target approximately 36 active listings, not 593.
2. Website listings remain intact with images.
3. Madlan-only active listings get Madlan fallback photos.
4. Yad2 images are still never stored.
5. Admin audit no longer shows hundreds of stale Madlan rows as normal review items.
6. If Madlan changes page structure, the importer fails safe: no mass insert, clear warning.

Expected result
The current bad Madlan over-import gets contained, the agency website inventory remains safe, and future Madlan imports become active-only, count-checked, and photo-aware.