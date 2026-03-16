

# Phase 3: CMS Adapters (WordPress + Wix)

## Bug Fix (prerequisite)
Line 1389 has a duplicate `const listing = JSON.parse(extractToolCall.function.arguments);` left over from Phase 2 edits. This is a syntax error (`listing` is already declared as `let` on line 1352). Must be removed first.

## What we're building

Three new functions + integration into `processOneItem` so that WordPress and Wix sites can have their listing data extracted directly from structured APIs/embedded state, skipping or supplementing the AI extraction step.

## Changes (all in `supabase/functions/import-agency-listings/index.ts`)

### 1. New function: `detectCmsType(html: string, url: string)`
- Check HTML for WordPress indicators: `wp-content`, `wp-json`, or `<meta name="generator" content="WordPress">`
- Check HTML for Wix indicators: `window.__INITIAL_STATE__`, `wix-warmup-data`, `_wixCssModules`, or `X-Wix-Published-Version`
- Returns `"wordpress" | "wix" | "generic"`

### 2. New function: `extractFromWordPress(url: string, firecrawlKey: string)`
- Derive base domain from the listing URL
- Try fetching `{origin}/wp-json/wp/v2/posts?per_page=1` and `{origin}/wp-json/wp/v2/property?per_page=1` (common CPT slug)
- If WP REST API responds with real estate post data, parse fields: title, content/excerpt → description, custom fields (price, bedrooms, size, address, city, images from `_embedded`)
- Returns extracted listing data or `null` if insufficient
- This is a **supplemental** extraction — if it returns data, we merge it with AI results (like we do with JSON-LD), boosting confidence

### 3. New function: `extractFromWixState(html: string)`
- Regex for `window\.__INITIAL_STATE__\s*=\s*({[\s\S]*?});` or `window\.__PRELOADED_STATE__`
- Parse the JSON, navigate to common Wix real estate app data paths (e.g., `wixCodeProps`, `dynamicPageData`, `currentItem`)
- Extract available fields: title, price, images, description, address, rooms, size
- Returns extracted data or `null`

### 4. Integration into `processOneItem` (after scrape, before AI extraction)
After we have `pageHtml` and `markdown` (around line 1300):

```
const cmsType = detectCmsType(pageHtml, item.url);
let cmsData: Record<string, any> | null = null;

if (cmsType === "wordpress") {
  cmsData = await extractFromWordPress(item.url, firecrawlKey);
} else if (cmsType === "wix") {
  cmsData = extractFromWixState(pageHtml);
}

// If CMS extraction got enough core fields, skip AI entirely
if (cmsData && cmsData.price && cmsData.city && cmsData.property_type) {
  listing = { ...cmsData, listing_category: "property", _cms_extracted: cmsType };
  // Skip AI call, jump to post-extraction
} else {
  // Normal AI extraction flow (existing code)
  // If cmsData partial, merge after AI extraction
}
```

- If CMS data has all core fields (price + city + property_type), skip AI entirely → saves tokens + increases accuracy
- If CMS data is partial, merge it after AI extraction (same pattern as JSON-LD merge) with higher priority than AI
- Add `_cms_extracted` flag to listing data for confidence scoring (+15 boost for full CMS extraction)

### 5. Update confidence scoring
In `computeConfidenceScore`, add a CMS extraction boost (similar to `hasStructuredData` but +15 instead of +10).

### 6. Remove duplicate line 1389
Delete `const listing = JSON.parse(extractToolCall.function.arguments);` — it's a leftover bug.

## No database changes needed

