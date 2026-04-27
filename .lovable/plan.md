Plan to fix the Erez import properly

The real failure is not just “11 imported.” It is a pipeline design issue: discovery only queued 82 URLs, then processing treated most Erez `/estate_property/...` pages as invalid because the AI/category confidence gates are too conservative for this WordPress real-estate site.

Goal: make agency website imports behave like a trusted owned-source import, while keeping Madlan/Yad2 safe and non-photo-storing.

1. Fix discovery so we find the right Erez pages

- Add deterministic URL rules before AI classification:
  - Any same-domain URL with `/estate_property/` is a strong listing candidate.
  - Do not let the AI classifier remove these candidates.
  - Still exclude true sold/rented/archive URLs and true 404s.
- Add Erez/WordPress pagination coverage:
  - Scrape likely archive/category pages like sale, rent, property action/category pages, and paginated `/page/N/` URLs.
  - Increase Firecrawl map limit from the current 500 if needed for agency sites.
- Keep discovered URLs, queued URLs, and filtered-out URLs separately in job metadata where possible, so the UI can show “found X, queued Y, skipped Z by reason.”

Expected result: website import should queue all live Erez property pages, not only the subset the AI happens to recognize.

2. Fix processing so valid agency pages are not skipped

- Add a source-aware listing override:
  - If source_type is `website` and URL path contains `/estate_property/`, treat it as a property page unless the fetch returns 404 or the page explicitly says sold/rented/unavailable.
  - Ignore AI `listing_category = not_listing` for this pattern when page content has title/images/property terms.
- Lower the confidence behavior for agency-owned sites:
  - For Madlan/Yad2, keep strict thresholds.
  - For agency website pages, do not skip solely because confidence is below 40 if the URL and page structure are clearly a property page.
  - Instead import a partial listing and flag it for quality review.
- Make low-confidence agency-site listings visible as “needs review,” not silently skipped.

Expected result: a page with missing price/rooms can still import if it is clearly an Erez listing, especially if it has photos and title/content.

3. Improve Erez extraction specifically without hardcoding fake data

- Add an Erez/WordPress parser fallback before/after AI:
  - Pull title from `<h1>`, Open Graph title, or WordPress title.
  - Pull description from main property content.
  - Pull price from common Hebrew/WordPress real-estate fields.
  - Pull rooms/size/floor/property type from page labels where present.
  - Infer sale/rent from Hebrew title/path words:
    - `למכירה` / `מכירה` => for_sale
    - `להשכרה` / `השכרה` / `לטווח` => for_rent
  - Infer city/neighborhood from page text/title where available.
- The fallback must not fabricate missing values. Missing fields remain null/0 and go to review.

Expected result: Erez pages that AI struggles with still produce enough structured data to create or merge a listing.

4. Fix photo behavior exactly as required

- Agency website photos:
  - Extract from AI result, JSON-LD, OG tags, HTML image tags, lazy-load attributes, `srcset`, and WordPress gallery markup.
  - Download/store only for agency-owned website pages.
- Madlan photos:
  - Do not store/download Madlan photos.
  - Madlan can fill text/data fields only.
- Yad2 photos:
  - Do not store/download Yad2 photos.
  - Yad2 should never contribute images.
- Dedup photos:
  - Deduplicate by normalized URL before download.
  - Deduplicate by image hash after download.
  - When merging into existing Madlan rows, add only new agency-site images.

Expected result: Erez own-site images become the primary images; Madlan/Yad2 images remain excluded.

5. Fix source priority for this business case

For provisioning, source priority should be:

```text
Photos:
1. Agency website only
2. Madlan only if explicitly allowed later — currently no storage
3. Yad2 never

Structured data:
1. Agency website for owned/official details
2. Madlan for missing data enrichment
3. Yad2 as fallback metadata only
```

Implementation detail: keep the merge logic source-aware so website data enriches existing Madlan properties instead of being skipped or duplicated.

6. Add a repair/retry path for the existing failed Erez job

- Add logic to reprocess skipped job items after the importer fix:
  - Reset Erez website job skipped items from `skipped` to `pending`, excluding true 404s and explicit sold/rented pages.
  - Re-run processing against the same 82 URLs.
- Then run a fresh discovery after the discovery fix to catch any additional pages beyond the original 82.

Expected result: we recover the current job and then find anything discovery missed.

7. Improve admin visibility so this is debuggable next time

- In the import UI, show skipped breakdown by reason:
  - Not a listing page
  - Low confidence
  - 404
  - Sold/rented
  - Unsupported city
  - Validation failed
- Add a “Retry skipped valid-looking website pages” action for admin provisioning jobs.
- Show “Imported,” “Merged,” and “Needs review” separately so “11 imported” is not misleading when some were merges.

8. Validation/testing plan

- Test against current Erez agency job:
  - Confirm the 58 “Not a listing page” items are reclassified if they are `/estate_property/` pages.
  - Confirm true 404 URLs stay skipped.
  - Confirm at least the known 30+ sale and 15+ rent are represented either as imported or merged.
- Confirm image policy:
  - Website imports have stored images.
  - Madlan-imported rows still have no Madlan-stored photos unless enriched by website photos.
  - Yad2 contributes zero stored photos.
- Deploy the updated backend function and run one Erez import pass.

Technical files likely touched

- `supabase/functions/import-agency-listings/index.ts`
  - discovery rules
  - URL classification fallback
  - Erez/WordPress parser fallback
  - confidence handling
  - agency-site photo extraction/dedup
  - skipped retry behavior if needed
- `src/components/admin/agency-provisioning/ImportListingsSection.tsx`
  - skipped reason breakdown / clearer status
  - optional retry skipped action
- Possibly `src/hooks/useImportListings.tsx` or related provisioning hook if the UI needs a new retry action.

What not to do

- Do not blindly import Madlan/Yad2 photos.
- Do not fabricate missing property data.
- Do not let AI classification be the only gate for known agency listing URL patterns.
- Do not silently skip agency-owned pages that are clearly property pages.