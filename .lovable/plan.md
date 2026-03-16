

# Phase 16: Cross-Source Dedup (Tier 3) — Insert into `duplicate_pairs`

## Current State
Cross-source duplicate detection already runs during both website and Yad2 import (lines ~2004-2048 for website, ~2625-2635 for Yad2). When a match is found, it sets `listing.cross_source_match_id` and adds a warning — but **never inserts into `duplicate_pairs`**. The admin Duplicates UI (`AdminDuplicates.tsx`) already supports viewing/merging/dismissing pairs via `DuplicateCompareCard`.

## Changes

### 1. `supabase/functions/import-agency-listings/index.ts` — Insert cross-source pairs

After property insertion succeeds in both `processItem()` (website) and `processYad2Item()`, if `listing.cross_source_match_id` exists, insert a row into `duplicate_pairs` with `detection_method: 'cross_source'`.

**Website flow** (after line ~2118, post-insert):
```typescript
// Insert cross-source duplicate pair
if (listing.cross_source_match_id && property?.id) {
  const [pa, pb] = property.id < listing.cross_source_match_id
    ? [property.id, listing.cross_source_match_id]
    : [listing.cross_source_match_id, property.id];
  await sb.from("duplicate_pairs").upsert({
    property_a: pa, property_b: pb,
    detection_method: "cross_source", similarity_score: null, status: "pending",
  }, { onConflict: "property_a,property_b", ignoreDuplicates: true });
}
```

**Yad2 flow** (after line ~2691, same pattern):
Same logic duplicated for the Yad2 path.

Also add a **fuzzy cross-source check** for Yad2 items (currently Yad2 Tier 3 only checks by address, not by specs). Add the same rooms+size+price fuzzy match that the website path uses (lines 2021-2037).

### 2. `src/components/admin/DuplicateCompareCard.tsx` — Show detection method

Add `detectionMethod` prop and display a badge distinguishing "Image Match" vs "Cross-Source" pairs:
- `phash` → "Image Match" (blue badge)
- `cross_source` → "Cross-Source" (orange badge)

### 3. `src/pages/admin/AdminDuplicates.tsx` — Filter by detection method

Add a secondary filter (or tab extension) to let admins filter by `detection_method`:
- Add a dropdown or segmented control: "All Methods" | "Image Match" | "Cross-Source"
- Pass `detection_method` filter to the query

## Files to Edit
- `supabase/functions/import-agency-listings/index.ts` — insert into `duplicate_pairs` after property creation; add fuzzy Tier 3 for Yad2
- `src/components/admin/DuplicateCompareCard.tsx` — show detection method badge
- `src/pages/admin/AdminDuplicates.tsx` — add detection method filter, pass method to card

