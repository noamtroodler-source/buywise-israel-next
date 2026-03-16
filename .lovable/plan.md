

# Phase 6.4: Image Optimization (WebP + Resize)

## Overview

Add image optimization during import: convert all downloaded images to WebP format and generate multiple sizes (thumbnail, medium, full). Uses `@imagemagick/magick-wasm` — the only image processing library supported in edge functions.

## Architecture

Create a new `optimize-image` edge function, then call it from `parallelImageDownload` in the import pipeline. Each image gets processed into 3 sizes and uploaded to storage with deterministic paths.

## Changes

### 1. New edge function: `supabase/functions/optimize-image/index.ts`

- Uses `@imagemagick/magick-wasm@0.0.30` (same pattern as Supabase's official docs)
- Accepts: `{ source_url: string, bucket: string, base_path: string }`
- Downloads the source image, then produces 3 variants:
  - **Thumbnail**: 300px wide, WebP → `{base_path}/thumb.webp`
  - **Medium**: 800px wide, WebP → `{base_path}/medium.webp`
  - **Full**: 1600px wide, WebP → `{base_path}/full.webp`
- Maintains aspect ratio on all resizes (only shrinks, never upscales)
- Validates minimum dimensions (200×200px) — rejects images smaller than this
- Uploads all 3 to the storage bucket
- Returns: `{ success: true, urls: { thumb, medium, full } }` or falls back to original on error

### 2. Update `supabase/config.toml`

Add `[functions.optimize-image]` with `verify_jwt = false`.

### 3. Update `parallelImageDownload` in `import-agency-listings/index.ts`

After uploading the original image, call `optimize-image` to produce WebP variants:

```
// After upload succeeds and we have publicUrl:
const optimized = await optimizeImage(publicUrl, bucketName, `imports/${jobId}/${imageId}`);
// Store the medium URL as the main image_url
// Store all variants in a metadata object
```

Add a helper `optimizeImage(sourceUrl, bucket, basePath)` that invokes the edge function and returns the URLs. On failure, falls back to the original URL silently.

### 4. Update property storage

The `image_urls` array stored on properties will use the **medium** (800px) URLs as the primary display images. The deterministic path structure means thumbnails and full-size versions can be derived by replacing `/medium.webp` with `/thumb.webp` or `/full.webp`.

### 5. Storage path structure

Change from random UUIDs to deterministic paths:
```
property-images/imports/{job_id}/{image_index}/full.webp
property-images/imports/{job_id}/{image_index}/medium.webp
property-images/imports/{job_id}/{image_index}/thumb.webp
```

## Edge Function Memory Consideration

The Supabase docs warn that images > 5MB may hit resource limits. The function will:
- Skip optimization for images > 5MB and keep the original
- Process images sequentially within the function (one at a time, not batch)

## Files to create/edit
- **Create**: `supabase/functions/optimize-image/index.ts`
- **Edit**: `supabase/functions/import-agency-listings/index.ts` (update `parallelImageDownload`)

## No database changes needed

