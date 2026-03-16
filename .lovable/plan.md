

# Phase 3: Apify Yad2 Adapter, Image pHash Dedup, Cross-Source Dedup

## Scope Assessment

The three deferred items have different feasibility profiles:

1. **Apify Yad2 Adapter** — Requires an Apify API key (external account). We build the adapter code; user provides the key via secrets.
2. **Image pHash Dedup** — Compute perceptual hashes in the edge function to detect near-duplicate images across listings. Lightweight average-hash approach (no external dependencies).
3. **Cross-Source Dedup (Tier 3)** — Extend dedup from agent-scoped to cross-agency matching. When importing, check if the same property exists under a different agency/source.

---

## 1. Apify Yad2 Adapter

New `source_type` parameter on import jobs: `"website"` (default, current behavior) or `"yad2"`.

**How it works:**
- User provides a Yad2 search URL (e.g., `yad2.co.il/realestate/forsale?city=...`)
- Edge function calls Apify's Yad2 scraper actor to extract structured listings
- Results are normalized into the same format as website scrape results
- Same validation, confidence scoring, dedup pipeline applies

**Changes:**
- `import-agency-listings/index.ts`: New `handleYad2Discover` and `processYad2Item` functions
- `import_jobs` table: Add `source_type` column (`website` | `yad2`)
- UI: Source type selector in `AgencyImport.tsx`
- Secret: `APIFY_API_KEY` via `add_secret` tool

**Apify integration pattern:**
- Start actor run via `https://api.apify.com/v2/acts/{actorId}/runs`
- Poll for completion
- Fetch results from dataset
- Each result already has structured fields (price, rooms, address, images) — skip AI extraction, go straight to validation

---

## 2. Image pHash Deduplication

Detect near-duplicate images within a listing import batch (e.g., same photo slightly cropped or resized).

**Approach:** Average Hash (aHash) — fast, no external libs needed in Deno:
- Fetch image as ArrayBuffer
- Decode to get pixel data (use canvas or simple JPEG header parsing)
- Resize conceptually to 8x8 grayscale
- Compare each pixel to mean brightness → 64-bit hash
- Hamming distance < 5 = duplicate

**Practical limitation:** Full image decoding in Deno edge functions is heavy. Instead, use a simpler signal:
- Compare image file sizes (within ±2% = likely same image)
- Compare image URL stems (strip query params, CDN prefixes)
- Track hashes of downloaded image bytes (MD5/SHA-256) during `parallelImageDownload` — exact byte-match dedup

**Changes in `import-agency-listings/index.ts`:**
- In `parallelImageDownload`: compute SHA-256 of each downloaded image
- Skip images with matching hashes (exact byte duplicates)
- Store hash in upload metadata for future cross-listing comparison
- Add `image_hashes` array to `extracted_data` for cross-source matching

---

## 3. Cross-Source Dedup (Tier 3)

Currently, Tier 1 and Tier 2 dedup are scoped to `agent_id`. Tier 3 checks across all agencies.

**When it triggers:** After Tier 1 and Tier 2 pass (no agent-scoped duplicate found).

**Matching criteria (cross-agency):**
- Same city + normalized address (exact match) → flag as potential cross-source duplicate
- Same city + bedrooms + size (±5 sqm) + price (±10%) → flag as potential duplicate

**Key difference from Tier 1/2:** Cross-source duplicates do NOT block import. Instead:
- Add `cross_source_match_id` to `extracted_data` pointing to the existing property
- Add a validation warning: "Potential cross-source duplicate with property {id}"
- Reduce confidence score by 10 points
- The listing still imports but gets flagged in the Review UI

**Changes:**
- `processOneItem`: After Tier 2, run Tier 3 queries against all properties (no `agent_id` filter)
- `ImportReviewCard.tsx`: Show cross-source duplicate warning with link to matched property

---

## DB Migration

```sql
ALTER TABLE public.import_jobs 
  ADD COLUMN IF NOT EXISTS source_type text NOT NULL DEFAULT 'website';
```

---

## Files Changed

1. **`supabase/functions/import-agency-listings/index.ts`** — Yad2 adapter functions, image hash dedup in download, cross-source Tier 3 dedup
2. **`src/pages/agency/AgencyImport.tsx`** — Source type selector (Website / Yad2)
3. **`src/components/agency/ImportReviewCard.tsx`** — Cross-source duplicate warning display
4. **`src/hooks/useImportListings.tsx`** — Pass `source_type` parameter
5. **DB migration** — `source_type` column on `import_jobs`

## Prerequisites

- User must provide an **Apify API key** (will use `add_secret` tool)
- User must have an Apify account with access to a Yad2 scraper actor

