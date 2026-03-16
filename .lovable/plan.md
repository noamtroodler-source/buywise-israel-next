

# Phase 10: Image pHash Dedup

## Problem
Current dedup uses SHA-256 (exact byte match only). Near-duplicate images — resized, recompressed, watermarked, or slightly cropped — slip through. This causes duplicate listings to have different SHA-256 hashes but visually identical photos.

## Approach

Use a **server-side perceptual hash (pHash)** computed via an edge function. pHash produces a 64-bit fingerprint from an image's DCT frequency data — visually similar images produce hashes with low Hamming distance (typically ≤ 5 bits apart).

Since Deno edge functions can't run native image libraries easily, we'll use a **pure-JS average hash (aHash)** approach: resize to 8×8 grayscale via canvas-like operations, then compute a 64-bit hash. This is simpler than DCT-based pHash but effective for catching resized/recompressed duplicates.

## Changes

### 1. New DB table: `image_hashes`
Stores computed perceptual hashes linked to property images for cross-listing dedup lookups.

```sql
CREATE TABLE public.image_hashes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  phash TEXT NOT NULL,        -- 16-char hex (64-bit perceptual hash)
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_image_hashes_phash ON public.image_hashes (phash);
CREATE INDEX idx_image_hashes_property ON public.image_hashes (property_id);
CREATE UNIQUE INDEX idx_image_hashes_url ON public.image_hashes (image_url);

ALTER TABLE public.image_hashes ENABLE ROW LEVEL SECURITY;
-- Admin-only access
CREATE POLICY "Admins manage image hashes"
  ON public.image_hashes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
```

### 2. New edge function: `compute-image-hash`
- Takes an image URL, downloads it
- Computes SHA-256 (exact dedup) + perceptual hash (aHash via 8×8 grayscale resize)
- Returns both hashes
- Used by the import pipeline to register hashes and check for near-dupes

### 3. New DB function: `find_similar_images`
SQL function that finds images with Hamming distance ≤ threshold from a given pHash. Uses `bit_count(phash_col::bit(64) # input::bit(64))` for efficient Hamming distance.

### 4. Update `import-agency-listings/index.ts`
- After `parallelImageDownload`, call `compute-image-hash` for each image
- Store results in `image_hashes` table
- Before inserting a new property, query `find_similar_images` to flag cross-agent visual duplicates
- Add `phash_duplicate_of` warning to validation warnings when matches found

### 5. Admin UI: Duplicate detection panel
- New section on admin dashboard showing properties flagged with pHash matches
- Side-by-side image comparison view
- Actions: merge, dismiss, or flag

## Files
- **Migration**: Create `image_hashes` table + `find_similar_images` function
- **New**: `supabase/functions/compute-image-hash/index.ts`
- **Edit**: `supabase/functions/import-agency-listings/index.ts` — integrate pHash during import
- **New**: `src/components/admin/ImageDedupPanel.tsx` — admin UI for reviewing pHash matches
- **Edit**: Admin dashboard to include the dedup panel

