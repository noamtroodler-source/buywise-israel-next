## Plan: make the Ashkelon Properties import safe before trying again

### What is actually going wrong

The current issue is not only duplicate handling anymore. The importer is still treating weak Ashkelon Properties `/post/...` pages as valid property listings too aggressively.

Current database check shows:

- Latest Ashkelon website job queued 105 URLs from 174 raw discovered URLs.
- 24 properties have already been created from that run.
- All 24 are flagged for review.
- 18 of 24 have no real images.
- 17 of 24 have weak address/location data.
- Many pending URLs are still waiting, so if processing continues it will likely create more bad rows.

The screenshot is therefore accurate: the pipeline is importing too many partial records before proving they are real, usable active listings.

---

## Phase 1 — Immediate containment

1. Stop the current Ashkelon Properties job from processing further.
2. Mark any remaining pending/processing items in that job as skipped or paused-for-review.
3. Remove the bad Ashkelon Properties records created by the latest broken import run.
4. Preserve enough job/item diagnostic data to compare before/after.

Goal: prevent more junk rows from being created while we fix the parser.

---

## Phase 2 — Add an Ashkelon/Wix-specific listing gate

Ashkelon Properties is a Wix/blog-style site where active listings live under `/post/...`, but not every `/post/...` is a clean listing. We need a stricter rule before insertion.

For agency-owned website imports, especially `ashkelonproperties.com`, a page should only be imported if it passes a hard validation gate:

### Required signals
A page must have at least two of these:

- Real asking price detected from visible text, including compact formats like `1.65`, `1.9 mil`, `770,000`, `7m`, etc.
- Real property structure detected: room count, bedroom count, sqm, garden apartment, penthouse, studio, house, duplex, etc.
- Real transaction intent: `for sale`, `quick sale`, `asking`, `long term rental`, `rental`, etc.
- Real location/neighborhood clue beyond just `Ashkelon`.
- A usable property photo from the main page content.

### Hard reject signals
Skip pages if they are:

- Blog/news/comment pages with no property facts.
- New development/project pages.
- Sold/rented/short-term rental pages.
- Pages whose only image is a Wix/system/error/chat/placeholder image.
- Pages where price is unknown or parsed as `0` unless the page has unusually strong listing facts and is intentionally imported as review-only.

Goal: discovery can still find many URLs, but only validated pages can create properties.

---

## Phase 3 — Fix image extraction for Wix pages

The current screenshot shows placeholder/error/cartoon images and many missing photos. The fetched sample page proves real images exist in the page markdown/HTML, but the importer is not consistently choosing them.

I will update the image collection logic to:

1. Extract real Wix media URLs from visible markdown and HTML.
2. Prefer main content/property images over related-post thumbnails.
3. Exclude obvious non-property/system images, including:
   - `error-img.png`
   - chat/widget assets
   - tiny tracking/background images
   - logos/icons
   - unrelated related-post thumbnails where possible
4. Use the first valid large image as the cover image.
5. Keep the existing zero-storage/compliance rules: only agency-owned website images may be stored; no third-party media storage.

Goal: Ashkelon listings should no longer show blank or system/error images when the site has real photos.

---

## Phase 4 — Improve description-line extraction

Ashkelon Properties has minimal structured data, but the visible description line contains useful facts. I will add a focused parser for these English description lines.

Examples it should handle:

- `3 rooms (2 bedrooms) right opposite Delilah beach for quick sale. Includes machsan and underground parking. Asking 1.65 or best offer.`
- `4 rooms for sale only 1.9 mil`
- `1 room studio 2 minutes from beach`
- `5 room bargain with sea view`

Fields to extract when present:

- price in NIS
- Israeli room count
- bedrooms using the Israeli standard conversion
- property type
- neighborhood/location phrase
- parking
- storage/machsan
- sea view
- beach proximity
- garden/penthouse/studio/house signals
- listing status: sale vs long-term rental

Goal: listings imported from short descriptions should be meaningfully populated instead of only showing `Ashkelon`.

---

## Phase 5 — Make low-quality imports fail closed, not import as junk

Right now, strong-looking agency URLs can override low confidence and import as flagged. That was meant to avoid losing real agency listings, but for Ashkelon it is creating bad records.

I will change this behavior for agency-owned websites:

- Strong URL alone is not enough to import.
- If the page has weak facts, no valid price, weak location, and no valid image, it must be skipped or held as an import job item, not inserted into `properties`.
- `properties` rows should only be created after the page clears minimum quality.
- Failed/held items should include a clear reason like `Weak Ashkelon listing facts`, `No usable property image`, or `Price missing from minimal agency page`.

Goal: the quality table should show fewer, better properties instead of many major-review junk rows.

---

## Phase 6 — Add better admin visibility before processing

I will adjust the admin import UI so this type of issue is obvious before import:

1. Discovery summary should distinguish:
   - raw URLs discovered
   - URLs queued as likely listings
   - URLs rejected by the pre-gate
   - already-imported URLs
2. For agency website jobs, show a warning if queued count is much higher than expected or if many URLs are blog-style `/post/...` pages.
3. Add clearer reason buckets for skipped items, especially:
   - not a property page
   - sold/rented
   - weak listing facts
   - missing usable images
   - project/development
4. Prevent “Process all” from blindly running if a site-specific gate reports suspicious discovery quality.

Goal: if a site returns 99/105 candidates when we expect about 35, the UI should warn us before records are created.

---

## Phase 7 — Fresh reimport and verification

After the code fix:

1. Delete the latest bad Ashkelon Properties rows again.
2. Start a clean discovery from the agency website.
3. Review the discovered/queued/skipped counts before processing.
4. Process a small batch first, not the whole job.
5. Verify:
   - count is much closer to the real active listing count
   - rows have real titles
   - rows have prices where shown on source page
   - rows have real agency-site images
   - location is better than just `Ashkelon` where the description provides clues
   - no placeholder/cartoon/error images appear
6. If the first batch looks clean, process the rest.

---

## Technical changes

### Edge function
Update `supabase/functions/import-agency-listings/index.ts`:

- Add a Wix/Ashkelon page-content gate.
- Add description-line parsing helpers.
- Tighten agency-owned website low-confidence handling.
- Improve Wix image extraction and filtering.
- Add clearer `import_job_items.error_message` values for rejected pages.
- Keep CORS and in-code auth behavior as-is.

### Admin UI
Update:

- `src/components/admin/agency-provisioning/ImportListingsSection.tsx`
- possibly `src/components/admin/agency-provisioning/ListingsQualitySection.tsx`
- possibly `src/hooks/useImportListings.tsx`

Changes:

- Surface discovery diagnostics more clearly.
- Add suspicious-discovery warnings.
- Improve skipped reason buckets.

### Database cleanup
Use a targeted migration/query sequence for Ashkelon Properties only:

- Stop/pause the active bad job.
- Delete properties created from the broken latest job.
- Clean related image hashes/source observations/job item links safely.
- Keep or archive diagnostics so we can compare the fixed run.

No broad platform data deletion.

---

## Success criteria

This is done only when:

- Ashkelon Properties no longer imports 99/105 weak candidates as listings.
- Bad rows from the current broken run are removed.
- Fresh import creates only validated active listings.
- Missing-photo listings are skipped unless there is a conscious review-only exception.
- Real Wix property photos are used when available.
- Description text populates price/rooms/features/location when source text provides it.
- The admin UI makes it clear why pages were skipped or held.

