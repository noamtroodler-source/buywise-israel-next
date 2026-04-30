## Goal

Make the agency import behave predictably for Ashkelon Properties and similar agency websites:

- The queued count should reflect real active listing pages, not stale jobs or duplicated discovery results.
- The import should not create duplicate property rows from the same source URL.
- Real agency-site photos should import when the agency owns the source website.
- AI/Street View fallback imagery should not be confused with actual listing photos during provisioning.
- Short agency description lines should be extracted and used to populate useful listing descriptions/facts.

## Scope of the fix

### 1. Clean up the stale import state for this agency

- Mark the old 99-item `ready/pending` job for Ashkelon Properties as cancelled/obsolete so it no longer appears as the current job.
- Keep the completed historical jobs visible as “Previous jobs,” but prevent old ready jobs from being treated as actionable.
- Adjust the provisioning UI if needed so the “current job” prioritizes the newest active job and ignores obsolete/cancelled ones.

### 2. Add exact-source duplicate protection

- Before inserting a new property from an agency website, check whether a property already exists for the same agency and the same canonical source URL.
- If it exists, update/enrich that existing property instead of inserting a new row.
- Add a database-level safety net where appropriate, likely a partial unique index for active imported rows by agency/source identity, so this cannot silently regress.
- Keep legitimate multi-unit same-building inventory allowed; this specific guard is for exact same source URL / same source identity repeats.

### 3. Improve agency website discovery counts

- Tighten discovery for Wix/agency sites so category/index pages and stale pages do not inflate the queue.
- Prefer deterministic listing URL patterns for `ashkelonproperties.com/post/...` and exclude known non-listing pages, sold/rented pages, short-term/vacation rental pages, and project/development pages earlier.
- Ensure repeated discovery runs subtract already-known source URLs so “new URLs” reflects what is actually new.

### 4. Fix real photo extraction for agency-owned websites

- Change agency-owned website scraping from `onlyMainContent: true` to a fuller scrape path where image/gallery markup is preserved.
- Expand HTML/markdown extraction to catch Wix image formats, including `static.wixstatic.com/media/...`, `srcset`, lazy-loaded attributes, Open Graph images, and JSON/embedded state where available.
- Add `image_urls` to the AI extraction schema only for agency-owned websites, since the current prompt asks for images but the schema blocks that field.
- Continue to block Yad2 media storage and keep the zero-storage third-party policy intact.
- Keep image filters for logos/placeholders, but tune them so real Wix listing photos are not accidentally discarded.

### 5. Separate listing photos from fallback imagery

- Treat `images` as actual listing photos only.
- Treat `street_view_url` / AI-enhanced exterior images as contextual fallback imagery, not imported property photos.
- In the provisioning table, show “no agency photo imported” separately from “fallback street view exists,” so it is not alarming or misleading.
- Avoid generating/enhancing Street View during the initial agency import review unless explicitly needed later.

### 6. Pull and use Ashkelon description lines

- Add a stronger agency-site text extractor for Wix pages that captures the visible short description line/body text from the listing page.
- Use that text to fill extracted facts: rooms, sqm, beach/marina/sea-view language, parking, gym, storage/machsan, furnished, air conditioning, etc.
- Feed the captured source text into the BuyWise description generator, while keeping the final wording original and factual.
- If only a short description exists, produce a concise trusted-friend description instead of over-inventing details.

### 7. Add import diagnostics for review

- Store lightweight diagnostics per import item, such as:
  - discovered image candidate count,
  - downloaded image count,
  - image rejection reasons,
  - description source used,
  - duplicate decision.
- Surface enough of this in admin/provisioning review so we can tell whether a listing has “no source images found,” “images found but rejected,” or “download failed.”

### 8. Repair current Ashkelon Properties data safely

After code/database guards are in place:

- Identify duplicate rows by exact `source_url` for this agency.
- Keep the best row per source URL, preferring the row with higher data quality, images, richer facts, or newer successful extraction.
- Merge useful fields from duplicates into the keeper where safe.
- Mark/delete duplicate rows only after preserving source observations/history.
- Re-run or backfill photo/description extraction for the retained Ashkelon listings.
- Leave all imported listings as draft/needs-review until manually approved.

## Technical details

Primary code area:

- `supabase/functions/import-agency-listings/index.ts`

Likely changes:

- Discovery:
  - improve URL canonicalization and already-known URL subtraction,
  - ignore obsolete jobs in the active-job flow,
  - tighten agency URL filtering.

- Scraping/extraction:
  - use fuller HTML scrape for agency-owned websites,
  - add `image_urls` to the extraction tool schema when `includeImagesInExtraction` is true,
  - improve `extractImagesFromHtml`, `extractStructuredData`, and Wix-specific extraction.

- Images:
  - improve `collectAgencyOwnedImages`, `parallelImageDownload`, and rejection diagnostics,
  - keep `images` separate from `street_view_url`,
  - prevent Street View/AI-enhanced fallback from appearing as a real source photo in provisioning.

- Dedup:
  - add exact source URL/source identity checks before insert,
  - possibly add a partial unique index on source identity for active imported properties,
  - update existing exact-source rows rather than insert duplicates.

- Data cleanup:
  - migration or admin repair script to cancel/obsolete stale jobs,
  - dedupe Ashkelon Properties rows by source URL,
  - backfill photos/descriptions for retained rows.

## Validation checklist

- Ashkelon Properties no longer shows the stale 99 queued job as the active import.
- Discovery returns roughly the real active site listing count, not inflated duplicates.
- Re-running import does not create a second property row for the same source URL.
- Imported agency-owned listings get real Wix/static source photos where available.
- Listings without source photos are clearly labeled as missing source photos, not silently replaced by AI/Street View.
- Description lines from the source page populate meaningful listing descriptions/facts.
- Existing zero-storage and third-party media rules remain respected for non-owned sources like Yad2.
- Current duplicate Ashkelon rows are cleaned up safely and retained listings remain draft/needs-review.