## Goal
Make the import pipeline work reliably across agency websites, Madlan, and Yad2, including the important case where some listings exist only on Madlan/Yad2 and not on the agency website.

The importer should not assume the agency website has every property. It should build the agency inventory from all available sources, merge duplicates intelligently, and use the best allowed photo source.

## Updated media rule
Use this source policy:

```text
Agency website photos: allowed and preferred
Madlan photos: allowed only when the listing is not available on the agency website, or when the agency website has no usable photos
Yad2 photos: never store/download
```

So the visual priority becomes:

```text
1. Agency website photos
2. Madlan photos, only as fallback / Madlan-only inventory support
3. Yad2 photos: never
4. AI/generated placeholder or neighborhood illustration if no allowed photos exist
```

This matters because a real agency may have:
- listings on its own site only
- listings on Madlan only
- listings on Yad2 only
- the same listing across multiple sources
- stale or partial listings on one source but better data on another

## Current diagnosis
The previous fix improved one major failure: valid agency website URLs like `/estate_property/...` should no longer be rejected just because the AI classifier is uncertain.

The next problems to solve are:
1. Some discovered Hebrew URLs appear malformed, for example `NaN7...`, so URL sanitation needs to happen before scraping.
2. The importer needs a true multi-source merge model, not “website first and everything else secondary.”
3. The admin UI needs clear reasons for skipped/failed items instead of one generic skipped count.
4. Madlan-only listings need to survive as real inventory and may need Madlan photos if no agency-site equivalent exists.

## Plan

### 1. Build a source-aware import model
Treat each source as an inventory feed, not merely enrichment.

For each agency source:
- Agency website: discover and import all clear property pages.
- Madlan: discover and import all agency-office listings, including listings not present on the agency website.
- Yad2: discover and import listing facts, but never store photos.

Each imported candidate should carry:
- `source_type`: website, madlan, or yad2
- `source_url`
- normalized address/location fields
- price/rooms/size
- allowed image policy status
- extraction confidence
- merge candidates

### 2. Harden URL discovery and sanitation
Before inserting URLs into `import_job_items`:
- normalize canonical URLs
- repair or reject malformed paths like `/estate_property/NaN7...`
- avoid double-decoding or corrupting Hebrew slugs
- remove tracking parameters
- deduplicate after canonicalization
- store diagnostics for any rejected malformed URL

This prevents wasting import attempts on broken URLs that can never scrape successfully.

### 3. Add sitemap-first agency website discovery
For WordPress/Erez-style websites, check sitemap sources before Firecrawl map output:

```text
/sitemap.xml
/property-sitemap.xml
/estate_property-sitemap.xml
/wp-sitemap-posts-estate_property-1.xml
```

Then merge with:
- Firecrawl map
- direct page links
- category pages
- sale/rent index pages
- pagination expansion

Sitemap URLs should be prioritized because they are usually canonical and cleaner than scraped links.

### 4. Add deterministic agency website profiles
For Erez-style sites:
- include `/estate_property/`
- exclude sold/rented/archive/category/search/blog/agent pages
- support Hebrew sale/rent keywords
- treat clear listing paths as listing pages even if AI confidence is low

This makes the importer less dependent on AI classification for obvious agency listing URLs.

### 5. Import partial agency listings instead of dropping them
For agency-owned website pages, use a partial-first policy:

If the page is clearly a property page, keep it unless it is clearly sold/rented, unsupported, or completely empty.

Partial records should become `flagged` for review when fields are missing, instead of being skipped.

Examples:
- has title + city + images but missing size: import flagged
- has price + rooms + city but weak description: import flagged
- has only generic text and no property facts: skip with clear reason

### 6. Strengthen deterministic extraction
Improve fallback extraction from:
- JSON-LD
- Open Graph tags
- WordPress property meta fields
- Hebrew labels for rooms, size, floor, price, sale/rent
- gallery images and `srcset`
- canonical URL hints

Extraction merge order:

```text
1. canonical URL / source facts
2. structured data
3. WordPress/Erez HTML parser
4. Madlan/Yad2-specific parser where applicable
5. AI extraction
6. domain/city fallback
```

### 7. Implement source-aware photo handling
Photo storage should follow this exact logic:

#### Website listing
- Download and store agency website images.
- These are the preferred images for that property.

#### Madlan listing that matches a website listing
- Do not replace good agency website photos with Madlan photos.
- Use Madlan for text/data enrichment only unless the website record has zero usable images.

#### Madlan listing with no website match
- Import the listing as real inventory.
- Download/store Madlan photos because this is the only visual source available for that listing.
- Mark image source metadata as `madlan_fallback` or equivalent so we know where photos came from.

#### Yad2 listing
- Never download/store Yad2 photos.
- If it matches website/Madlan, use those allowed images.
- If it is Yad2-only, import facts if quality is sufficient, but use generated/neighborhood/placeholder imagery.

### 8. Improve duplicate detection and merging
Use multi-source matching to prevent duplicates while preserving source-specific inventory.

Match using:
- normalized address
- city/neighborhood
- price variance
- room count
- size
- coordinate proximity if available
- image similarity only for allowed image sources
- source URL canonicalization

Merge behavior:
- If website + Madlan + Yad2 refer to the same listing, create/keep one property.
- Preserve all source URLs for audit.
- Use source priority for facts, but photo priority should follow allowed media logic:

```text
Best photos: website
Fallback photos: Madlan
Never photos: Yad2
```

### 9. Make skip/failure reporting operational
Update the admin provisioning UI to show grouped reason buckets:

```text
Malformed URL
Fetch/scrape failed
Blocked/rate limited
Not a listing
Sold/rented
Unsupported city
Validation failed
Low confidence
Duplicate/merged
No allowed photos
Imported but flagged
```

Each bucket should show count and sample URLs. This makes it clear whether a source is failing because of real data limits or importer bugs.

### 10. Add smarter retry controls
Keep separate actions:
- Retry transient failures: network, rate limit, timeout, scrape blocked.
- Retry recoverable skipped: low-confidence agency page, parser improved, malformed URL repaired, AI returned no data.
- Do not retry true permanent skips by default: sold/rented, unsupported city, intentionally blocked ownership conflict.

### 11. Improve job funnel metrics
Show a full funnel in the UI:

```text
URLs discovered
Canonical listing URLs
Already imported
Queued
Fetched
Extracted
Imported
Imported flagged
Merged into existing
Skipped by reason
Failed transiently
```

For multi-source imports, also show per-source counts:

```text
Website: discovered / imported / merged / failed
Madlan: discovered / imported / merged / failed
Yad2: discovered / imported / merged / failed
```

### 12. Validate against the current Erez run
After implementation:
- Re-run website discovery.
- Re-run Madlan discovery if an active Madlan source exists.
- Re-run Yad2 discovery if an active Yad2 source exists.
- Confirm the importer can capture listings that are missing from the agency website but present on Madlan/Yad2.
- Confirm Madlan-only listings can have Madlan photos.
- Confirm Yad2-only listings never store Yad2 photos.
- Confirm all remaining skipped items have clear, useful reasons.

## Technical implementation areas

Backend:
- `supabase/functions/import-agency-listings/index.ts`
  - URL sanitation and malformed URL diagnostics
  - sitemap-first discovery
  - source-aware media rules
  - Madlan-only photo fallback
  - Yad2 photo ban enforcement
  - stronger deterministic extraction
  - smarter retry categories
  - richer job summary metadata

Frontend/admin:
- `src/components/admin/agency-provisioning/ImportListingsSection.tsx`
- `src/hooks/useImportListings.tsx`
  - grouped skip/failure buckets
  - per-source import metrics
  - clearer retry controls
  - better explanation of imported, flagged, merged, skipped, failed

## Success criteria
- Valid `/estate_property/` pages are not rejected by AI uncertainty.
- Malformed `NaN...` URLs are repaired or excluded before scraping.
- Website, Madlan, and Yad2 are all treated as real inventory sources.
- Madlan-only listings import successfully and can use Madlan photos.
- Website photos remain preferred when available.
- Yad2 photos are never stored.
- Good partial agency listings become flagged instead of disappearing.
- The admin can see exactly why every non-imported URL did not import.
- Final import count reflects actual agency inventory across sources, not just the agency website.