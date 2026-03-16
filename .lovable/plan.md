

# Phase 14: Geocoding Upgrade

## Problem
The `import-agency-listings` edge function uses an inline Nominatim-only geocoder with basic rate limiting. Meanwhile, the dedicated `geocode-address` edge function already implements Google Maps as primary with Nominatim fallback, multiple address variations, and Israel bounds validation — but the import pipeline doesn't use it.

## Changes

### File: `supabase/functions/import-agency-listings/index.ts`

**1. Replace `geocodeWithRateLimit` function (lines ~948-974)**

Replace the inline Nominatim implementation with a call to the `geocode-address` edge function via internal fetch:

```typescript
async function geocodeWithRateLimit(
  address: string, 
  city: string, 
  entityType: 'property' | 'project' = 'property',
  entityId?: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/geocode-address`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityType,
          entityId: entityId || crypto.randomUUID(), // placeholder if no ID yet
          address, city
        }),
      }
    );
    const data = await res.json();
    if (data.success) {
      return { lat: data.latitude, lng: data.longitude };
    }
    return null;
  } catch { return null; }
}
```

This gives the import pipeline: Google Maps primary → Nominatim fallback → multiple address variations → Israel bounds validation — all for free via the existing function.

**2. Remove stale rate-limit state variables** (lines ~950-951)
Remove `_lastGeoTime` and `_geoQueue` — no longer needed since the geocode-address function handles its own rate limiting.

**3. Update call sites** (lines ~2051-2054, ~2318-2321, ~2638-2641)
No signature changes needed at call sites since we keep the same `(address, city) → {lat, lng} | null` return type. The `entityId` parameter is optional.

**4. Handle the DB write side-effect**
The `geocode-address` function writes lat/lng to the DB. For import items that don't have a property ID yet, we pass a dummy UUID — the coordinates will be overwritten when the property is actually inserted. Alternatively, we can skip passing `entityId` and just use the returned coordinates without the DB side-effect by catching the DB error gracefully (the function still returns coordinates even if the DB update targets a non-existent row — but actually it would fail). 

**Better approach**: Modify the geocode call to not save to DB when used from import. We'll add an optional `skipDbSave: true` parameter to `geocode-address`.

### File: `supabase/functions/geocode-address/index.ts`

**5. Add `skipDbSave` parameter** to the request interface and skip the DB update when true. This lets the import pipeline use geocoding without side effects (it handles its own property insert).

## Files to Edit
- `supabase/functions/import-agency-listings/index.ts` — replace geocoding function, remove rate-limit state
- `supabase/functions/geocode-address/index.ts` — add `skipDbSave` option

