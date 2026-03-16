

# Expand Skip Property Types Filter

## Problem
The blueprint specifies skipping **parking**, **storage**, **building**, **agricultural_estate**, and **assisted_living** during import. Currently `SKIP_PROPERTY_TYPES` only contains `"land"` and `"commercial"`.

Additionally, the Hebrew dictionary (line 1334) maps `מחסן` → `commercial` and `חניה` → `commercial`, which means parking/storage listings sneak in as "commercial" and get skipped — but only by accident. Other types like `building`, `agricultural_estate`, and `assisted_living` aren't mapped or filtered at all.

## Changes

### `supabase/functions/import-agency-listings/index.ts`

**1. Add new types to `VALID_PROPERTY_TYPES` and `SKIP_PROPERTY_TYPES` (~line 389-396)**

```typescript
const VALID_PROPERTY_TYPES = [
  "apartment", "garden_apartment", "penthouse", "mini_penthouse",
  "duplex", "house", "cottage", "land", "commercial",
  "parking", "storage", "building", "agricultural_estate", "assisted_living",
];

const SKIP_PROPERTY_TYPES = new Set([
  "land", "commercial", "parking", "storage",
  "building", "agricultural_estate", "assisted_living",
]);
```

**2. Update Hebrew dictionary in AI prompt (~line 1332-1334)**

Add explicit mappings so AI classifies these correctly instead of lumping into "commercial":
```
מחסן = storage | חניה = parking | בניין = building | בניין שלם = building
חקלאי = agricultural_estate | משק חקלאי = agricultural_estate | נחלה = agricultural_estate
דיור מוגן = assisted_living
```

**3. Update AI prompt enum lists (~lines 1630, 1658, 1817)**

Add the new types to the `property_type` enum in all three AI prompt locations so Gemini can output them.

**4. Update `mapYad2PropertyType` (~line 2796)**

Add mappings for Yad2-specific Hebrew terms:
- `חניה`/`parking` → `"parking"`
- `מחסן`/`storage` → `"storage"`  
- `בניין`/`building` → `"building"`
- `חקלאי`/`נחלה`/`agricultural` → `"agricultural_estate"`
- `דיור מוגן`/`assisted` → `"assisted_living"`

**5. Make skip check apply to all import modes (not just resale)**

Currently the skip check at line 426 fires unconditionally (no `importType` guard), which is correct — these types should always be skipped.

## Result
Parking spots, storage units, whole buildings, agricultural estates, and assisted living facilities will be properly classified by AI/Yad2 mapper and then rejected during validation with a clear error message, instead of either sneaking through as "commercial" or being misclassified as "apartment".

