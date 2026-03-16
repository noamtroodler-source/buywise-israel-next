

# Phase 18: Yad2 Agency Page Import

## Problem
Currently, the Yad2 source type only supports **search result URLs** (e.g., `yad2.co.il/realestate/forsale?city=...`). Agency profile pages (`yad2.co.il/agency/{id}`) have a different structure and aren't handled — the Apify scraper may not extract individual listing links from an agency profile page.

## Approach

### 1. Edge Function: New `yad2_agency` source type in `import-agency-listings/index.ts`

Add a new handler `handleYad2AgencyDiscover(body)` that:

1. **Detects** agency profile URLs: matches pattern `/agency/` or `/professionals/` in the Yad2 URL
2. **Scrapes** the agency page via Firecrawl (markdown + links format) to extract all listing URLs
3. **Filters** links to only Yad2 listing URLs (matching `/item/` or `/realestate/` item patterns)
4. **Deduplicates** against existing `properties.source_url` for this agency
5. **Creates** an import job with `source_type: 'yad2'` and items with each listing URL
6. **Each item** goes through the existing Apify Yad2 single-item scraper during `process_batch` (or directly scrapes the item URL via Firecrawl + AI extraction as fallback)

**Alternative simpler approach**: Instead of calling Apify per-item, pass the discovered listing URLs directly to the existing Apify actor as `startUrls` — same as current `handleYad2Discover` but with pre-discovered URLs from the agency page.

**Routing**: In the main handler, detect if `source_type === 'yad2'` AND the URL contains `/agency/` or `/professionals/` → route to `handleYad2AgencyDiscover`, otherwise existing `handleYad2Discover`.

### 2. UI: Add `yad2_agency` as a third source option in `AgencyImport.tsx`

- Add a third source button: "Yad2 Agency Page"
- Or auto-detect: when source is `yad2` and URL contains `/agency/`, automatically use the agency page flow
- Update placeholder text accordingly

## Files to Edit

- **`supabase/functions/import-agency-listings/index.ts`**: Add `handleYad2AgencyDiscover()` (~60 lines). Uses Firecrawl to scrape agency page, extract listing URLs, then creates job+items. Reuses existing Yad2 processing path.
- **`src/pages/agency/AgencyImport.tsx`**: Auto-detect agency page URLs when Yad2 source is selected. Update helper text to mention agency page support.

## Key Detail

The auto-detection approach is cleanest: when `source_type === 'yad2'`, the edge function checks if the URL matches an agency profile pattern. If so, it uses Firecrawl to discover listing URLs from the page, then passes them to Apify as `startUrls` (reusing the existing polling + job creation logic). No new source type needed in the UI — just smarter routing in the backend.

