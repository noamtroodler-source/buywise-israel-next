# Fix: only scrape the right photos for each listing

## Goal
For every agency site we scrape (JRE, Erez, future agencies), the imported listing should contain **only the photos that belong to that specific property** — never sidebar "similar listings", footer carousels, agent avatars, or site logos.

## Why it's broken today
`extractImagesFromHtml` (in `supabase/functions/import-agency-listings/index.ts` ~line 3329) runs 5 regex sweeps over the entire HTML:
1. Every `wixstatic.com/media/...` URL anywhere in the page state
2. Every `<img src>` tag
3. Every `data-src / data-lazy-src / data-original / data-srcset / data-large_image / data-full / data-thumb` attribute
4. Every `<a href>` pointing to an image
5. Plus JSON-LD `structured_images` and the OG image, merged in afterward

It unions everything, so a JRE listing with ~10 real photos balloons to 30–42 by adding the "Similar Properties" carousel thumbs, lightbox duplicates, and OG/share variants.

## The fix — three layers, applied in order

### Layer 1 — DOM-aware gallery scoping (primary)
Replace the page-wide regex with a real DOM parse using `deno-dom`. Walk a priority list of selectors and stop at the first match that returns ≥3 images:

```text
1. JSON-LD with @type RealEstateListing | Product | Residence → use its `image` array
2. <main> / <article> scoped:
   - [class*="property-gallery"], [class*="listing-gallery"],
     [class*="single-property-images"], [class*="property-images"]
   - .woocommerce-product-gallery
   - [data-elementor-type="single"] [class*="gallery"]
   - .wp-block-gallery (first one inside main/article only)
   - .swiper-wrapper, .slick-slider, .splide__list (first one inside main only)
3. og:image (single fallback)
```

If layer 1 returns ≥3 images → use those, stop. Do NOT union with whole-page scan.

### Layer 2 — Hard exclusions (always applied to layer 1 results)
Even when scoping succeeds, drop images whose DOM ancestry matches any of:

- Inside `<aside>`, `<footer>`, `<nav>`, `<header>`
- Inside `[class*="related"]`, `[class*="similar"]`, `[class*="recommend"]`, `[class*="recent"]`, `[class*="popular"]`, `[class*="sidebar"]`, `[id*="related"]`, `[class*="other-listings"]`, `[class*="more-properties"]`
- Inside `[class*="agent"]`, `[class*="author"]`, `[class*="profile-pic"]`, `[class*="avatar"]`, `[class*="team"]`, `[class*="testimonial"]`, `[class*="review"]`
- Inside an `<a href>` whose URL slug is **different** from the current page slug — kills the "Similar Properties" tile leak by structure, not by class name (works on any builder)

### Layer 3 — Per-agency overrides (data-driven)
Add a JSONB `scrape_config` column to the agency record. Optional fields:

```json
{
  "gallery_selector": ".property-images-gallery",
  "exclude_selectors": [".similar-properties", ".agent-card"]
}
```

When present, layer 1 uses `gallery_selector` first; layer 2 adds `exclude_selectors` to its always-on list. Lets us hand-fix one-off sites without redeploying code.

### Safety net (already exists, keep it)
The Gemini cover-selector at line 2557 stays. After layers 1–3 we still cap to a hard max of 20 photos and let Gemini pick the cover — but the input to Gemini is now clean.

## Validation plan
1. Re-scrape the 10 JRE listings I queried earlier (`https://jerusalem-real-estate.co/property/...`)
2. Confirm photo counts drop to ~8–15 each (vs current 22–42)
3. Confirm zero photos whose URL or `<a href>` ancestor references a *different* property slug
4. Spot-check the existing imported records: clear and re-run those 10 to compare before/after

## Out of scope (intentional)
- The wrong-title problem (URLs not matching titles) — that's a separate AI-extraction bug, not a photo bug. Flag it as a follow-up but don't bundle it here.
- Changing how photos are stored — zero-storage policy still applies; we're only changing **which** URLs we keep.

## Technical details

**Files touched:**
- `supabase/functions/import-agency-listings/index.ts` — rewrite `extractImagesFromHtml` (~line 3329) to DOM-based; add `extractGalleryFromDom`, `isInExcludedAncestor`, `getNearestAnchorSlug` helpers; thread `agency.scrape_config` through `processFirecrawlResult` → `extractImagesFromMarkdown` → `extractImagesFromHtml`.
- New migration: `alter table agencies add column if not exists scrape_config jsonb;`
- `deno-dom` import via `npm:deno-dom@0.1.x` (or use `linkedom` if deno-dom proves flaky in the edge runtime)

**Risk:** Some sites may have non-standard markup that defeats all layer-1 selectors. Fallback path: if layer 1 returns 0 images, we fall back to the **current** regex extractor but with layer 2 exclusions applied. Worst case = same behavior as today, never worse.

**Rollout:** Deploy → re-scrape 1 JRE listing via the admin UI → verify count → re-scrape full agency.
