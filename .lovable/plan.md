

# Phase 9: Geocoding Upgrade

## Current State

- **`geocode-address`** (properties/projects): Nominatim only, no Google fallback
- **`geocode-sold-transaction`** (admin batch): Has Google Maps fallback code, but `GOOGLE_MAPS_API_KEY` is **not configured as a secret** — so it silently falls back to Nominatim every time
- The Google Maps API key exists client-side (`VITE_GOOGLE_MAPS_API_KEY` in `.env`) but is NOT available to edge functions

## Changes

### 1. Add `GOOGLE_MAPS_API_KEY` secret

The client-side key from `.env` needs to be added as an edge function secret so both geocoding functions can use it. Will use `add_secret` to request this.

### 2. Upgrade `geocode-address/index.ts`

Add Google Geocoding API as primary provider (more accurate for Israeli addresses), keeping Nominatim as fallback:

- Add `geocodeWithGoogle()` function using Google Geocoding API
- Update `tryMultipleFormats()` to try Google first with the full address, then fall back to Nominatim variations
- Keep Israel bounds validation for both providers
- Return `source: 'google_maps' | 'nominatim'` in response

### 3. Clean up `geocode-sold-transaction/index.ts`

- Already has Google fallback — will work once the secret is added
- Add Israel bounds validation (currently missing from this function)
- Add the multi-format address variation logic from `geocode-address` for better hit rate

### 4. Update `useAutoGeocode.ts`

- Surface the `source` field in the hook return so the UI can show which geocoder was used (useful for debugging)

## Files
- **Secret**: Add `GOOGLE_MAPS_API_KEY` 
- **Edit**: `supabase/functions/geocode-address/index.ts` — add Google as primary geocoder
- **Edit**: `supabase/functions/geocode-sold-transaction/index.ts` — add bounds validation + address variations
- **Edit**: `src/hooks/useAutoGeocode.ts` — expose geocode source

