

# Enhance ALL Uploaded Photos with AI

## Current State
`SortableImageUpload.tsx` (lines 273-291) only enhances the **cover photo** (index 0). The `enhance-image` edge function and `enhanceUploadedImage` helper already exist and work. The legacy `ImageUpload.tsx` already enhances all photos — we just need to replicate that pattern.

## Change

**File: `src/components/agent/SortableImageUpload.tsx`** — Replace the cover-only enhancement block (lines 273-291) with a loop that enhances ALL newly uploaded images in parallel:

- Set `enhancingCount` to `newUrls.length`
- Show toast: "Enhancing X photo(s) with AI..."
- `Promise.allSettled` all `enhanceUploadedImage(url)` calls
- Map results back into `allImages`, replacing originals with enhanced versions
- Toast success with count of actually enhanced images
- Graceful fallback: any failed enhancement keeps the original

**File: `src/components/developer/wizard/steps/StepPhotos.tsx`** — Add the same enhancement call after successful uploads (this component currently has zero enhancement logic).

**File: `src/components/agent/wizard/steps/StepPhotos.tsx`** — No changes needed (it delegates to `SortableImageUpload`).

## Cost
~$0.01-0.02 per image × 10 images = ~$0.10-0.20 per listing. At 100 listings/month ≈ $10-20/month.

## No database or edge function changes needed
The existing `enhance-image` edge function handles everything — we're just calling it for more images.

