

# Street View Image Quality Overhaul

## Overview
Five improvements to the street view pipeline: better camera params, smart heading toward the building, metadata pre-check with satellite fallback, upgraded AI style transfer prompt, and higher-res source images.

## Changes

### 1. Better Camera Parameters
**File:** `supabase/functions/import-agency-listings/index.ts` — `generateAndStoreStreetView`
- Change `size=800x400` → `size=1200x600`
- Change `fov=90` → `fov=70` (tighter, less distortion)
- Change `pitch=10` → `pitch=5` (slightly more natural angle)

### 2. Smart Heading via Street View Metadata API
**File:** `supabase/functions/import-agency-listings/index.ts`

Replace `deriveHeading()` with a new approach:
- Call Google Street View Metadata API first: `https://maps.googleapis.com/maps/api/streetview/metadata?location=LAT,LNG&key=KEY`
- This returns the actual camera `location` (where the Street View car was). Extract its lat/lng.
- Calculate the **bearing from the camera position to the property coordinates** using the standard formula: `atan2(sin(dLng)*cos(lat2), cos(lat1)*sin(lat2) - sin(lat1)*cos(lat2)*cos(dLng))`
- Use this bearing as the `heading` parameter — the camera will face the building directly.
- Keep the old `deriveHeading` as fallback if metadata call fails or returns no location.

### 3. Street View Coverage Check + Satellite Fallback
**File:** `supabase/functions/import-agency-listings/index.ts` — `generateAndStoreStreetView`

The metadata API response includes a `status` field:
- If `status === "OK"` → proceed with street view fetch
- If `status === "ZERO_RESULTS"` or other → generate a **satellite fallback** instead:
  - URL: `https://maps.googleapis.com/maps/api/staticmap?center=LAT,LNG&zoom=19&size=1200x600&maptype=satellite&key=KEY`
  - Store this as `street_view_url` (it's still a location image, just aerial)
  - Add a `street_view_type` column to properties (`street_view` | `satellite`) so the UI can optionally badge it

**Migration:** Add `street_view_type TEXT DEFAULT 'street_view'` column to `properties` table.

### 4. AI Style Transfer Upgrade
**File:** `supabase/functions/enhance-image/index.ts`

Update the AI prompt to apply a clean architectural illustration style rather than just technical corrections. Accept an optional `style` parameter in the request body:
- When `style === "architectural"` (default for street views): Use a prompt like: *"Transform this street-level photo into a clean, professional architectural visualization. Maintain the exact building geometry, proportions, and layout. Apply a clean modern rendering style with soft natural lighting, reduced visual noise, and cohesive color grading. Remove compression artifacts, lens flare, and visual clutter (power lines, trash bins) while keeping the building facade accurate. The result should look like an architect's exterior rendering."*
- When `style === "photo_correct"` (existing behavior): Keep the current prompt for interior photos.

### 5. Backfill Handler Update
**File:** `supabase/functions/import-agency-listings/index.ts` — `handleBackfillStreetView`

Update the backfill query to also select properties that have the old low-res street view URLs (containing `size=800x400`) so we can re-generate them at higher quality. Add a `force_refresh` parameter.

## Implementation Order
1. DB migration (add `street_view_type` column)
2. Update `enhance-image` edge function with style parameter
3. Update `import-agency-listings` with all street view improvements (metadata check, bearing calc, satellite fallback, higher res params)
4. Deploy both edge functions
5. Test with a single property backfill to verify quality

## Technical Details
- The Street View Metadata API call is free (no image charges), so the coverage pre-check adds no cost
- Satellite Static Maps API costs the same as Street View per request
- The bearing calculation uses standard geodesic math (same Haversine family already in the codebase at `src/lib/utils/geometry.ts`)
- The `enhance-image` function already handles the upload-to-storage flow, so the style transfer just changes the prompt text

