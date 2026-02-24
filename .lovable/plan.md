

# Cover-Photo-Only AI Enhancement

## Overview
Limit AI image enhancement to **only the first (cover) photo** for each listing — both during manual uploads and bulk imports. This drops costs from ~$0.28/listing to ~$0.04/listing while keeping the highest-impact image looking sharp.

## Changes

### 1. Manual Upload — `src/components/agent/SortableImageUpload.tsx`

Currently, after uploading, ALL new images get enhanced in the background. Change this so only the **first image in the full list** (the cover photo) gets enhanced — and only if it's among the newly uploaded batch.

- After upload, check if the cover photo (index 0 in `allImages`) is one of the newly uploaded URLs
- If yes, enhance only that one image
- Skip enhancement for all other images
- Update the toast message to say "Enhancing cover photo..." instead of "Enhancing X images..."

### 2. Bulk Import — `supabase/functions/import-agency-listings/index.ts`

Currently, every downloaded image gets passed through `enhanceImage()`. Change this so only the **first image** in the array gets enhanced.

- In the image download loop, track the image index
- Only call `enhanceImage()` for index 0 (the cover/first image)
- All other images keep their original uploaded URL

### 3. No changes needed to:
- The `enhance-image` edge function itself (the prompt is already tightened)
- The `ImageUpload.tsx` component (used elsewhere, will check if still relevant)
- Database schema or storage

## Cost Impact
- Before: ~$0.28/listing (7 images x $0.039)
- After: ~$0.04/listing (1 image x $0.039)
- For 100 listings: ~$4 instead of ~$28

