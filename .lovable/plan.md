

# Import System Optimization — Phased Plan

## Gap Analysis (What's NOT yet built)

Comparing the document against current code, these items remain:

1. **Floor validation**: `floor <= total_floors` check — missing
2. **WordPress REST API adapter**: `/wp-json/wp/v2/posts` detection — missing
3. **Wix `__INITIAL_STATE__` adapter**: Parse embedded JS state — missing
4. **Yad2 lat/lon passthrough**: Skip geocoding when Apify returns coordinates — missing
5. **Dynamic concurrency with 429 backoff**: Currently fixed at 3 concurrent — missing
6. **AI retry with simplified prompt**: On extraction failure, retry with fewer fields — missing
7. **WebP conversion + resize** (thumbnail/medium/full): Currently uploads original format — missing
8. **Job resume after timeout**: Mark remaining as "timeout", allow resume — partially exists (process_all loops, but no timeout status)
9. **Review UI improvements**: Photo reordering, merge option for duplicates, field-level confidence dots — missing
10. **Incremental sync price change detection**: Existing sync just finds new listings, doesn't detect price changes — missing

---

## Phase 1: Validation + Yad2 Geocoding (quick wins, high impact)

**Why first**: These are small, zero-risk changes that immediately improve data quality.

1. **Add `floor <= total_floors` validation** in `validatePropertyData` — warn if floor > total_floors
2. **Use Yad2 lat/lon directly** in `processYad2Item` — if `raw.latitude`/`raw.longitude` or `raw.coordinates` exist, skip Nominatim geocoding call (saves API calls + improves accuracy)
3. **Pass Yad2 coordinates through `normalizeYad2Result`** — extract `geographic_polygon`, `latitude`, `longitude` from Apify result

**Files**: `import-agency-listings/index.ts` only

---

## Phase 2: Dynamic Concurrency + AI Retry

**Why second**: Directly improves import success rate and reliability.

1. **Dynamic concurrency**: Start at `CONCURRENCY=5`, drop to 2 on 429/timeout, recover after 3 successful batches. Track `consecutiveFailures` counter in `handleProcessBatch`.
2. **Simplified prompt retry**: When AI extraction returns no data or fails, retry once with a stripped-down prompt (just price, rooms, size, city, address, property_type — no features/condition/amenities). Add a `retryWithSimplifiedPrompt()` helper.

**Files**: `import-agency-listings/index.ts`

---

## Phase 3: CMS Adapters (WordPress + Wix)

**Why third**: Reduces AI dependency for structured sites, improving accuracy for a significant portion of agency websites.

1. **WordPress detection**: Before Firecrawl scrape, check `{domain}/wp-json/wp/v2/` — if 200, fetch posts with real estate CPT. Map WP fields to our schema. Skip AI extraction when WP data is sufficient.
2. **Wix detection**: In scraped HTML, look for `window.__INITIAL_STATE__` or `window.__PRELOADED_STATE__`. Parse the JSON to extract listing data. Skip AI if complete.
3. **Adapter selection logic**: In `processOneItem`, before Firecrawl scrape, run `detectCmsType(url)` → returns `"wordpress" | "wix" | "generic"`. Route accordingly.

**Files**: `import-agency-listings/index.ts` (new functions: `detectCmsType`, `extractFromWordPress`, `extractFromWixState`)

---

## Phase 4: Image Optimization (WebP + Resize)

**Why fourth**: Requires more work, improves storage costs and page load but isn't blocking imports.

1. **WebP conversion**: In `parallelImageDownload`, after fetching image buffer, convert to WebP using a lightweight approach (upload as-is but with `.webp` extension and proper content-type header — Supabase Storage serves as-is)
2. **Multiple sizes**: Generate thumbnail (300px), medium (800px), full (1600px) — this requires image processing which is heavy in Deno. Practical approach: store original, generate sizes via an on-demand image transformation URL (or a separate edge function with Sharp/canvas)
3. **Store original source URL in metadata**: Add `original_url` field alongside each stored image

**Files**: `import-agency-listings/index.ts`, potentially a new `resize-image` edge function

---

## Phase 5: Review UI Enhancements

**Why last**: Polish layer. Import pipeline should be stable first.

1. **Field-level confidence dots** (green/yellow/red) on each field in `ImportReviewCard`
2. **Duplicate merge option**: When cross-source duplicate detected, show "Merge" button that keeps the version with more data
3. **Price change detection in sync**: Compare existing property price with re-discovered listing price, flag changes
4. **Quick filters**: "Missing photos", "Low confidence", "Potential duplicates" tabs in review page

**Files**: `ImportReviewCard.tsx`, `AgencyImportReview.tsx`, `sync-agency-listings/index.ts`

---

## Summary

| Phase | Focus | Effort | Impact |
|-------|-------|--------|--------|
| 1 | Floor validation + Yad2 geocoding | ~30 min | High (data quality) |
| 2 | Dynamic concurrency + AI retry | ~1 hour | High (reliability) |
| 3 | WordPress/Wix adapters | ~2 hours | Medium (accuracy for CMS sites) |
| 4 | WebP + image optimization | ~2 hours | Medium (performance) |
| 5 | Review UI polish | ~3 hours | Medium (UX) |

Starting with Phase 1 immediately since it's quick and impactful.

