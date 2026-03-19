

# Import 22 New Shuls (Phase 3) into map_pois

## Overview
Insert 22 new shul records from the uploaded CSV into the `map_pois` table. No duplicates exist with current data.

## Data Mapping

| CSV Column | DB Column |
|------------|-----------|
| NAME | name |
| CATEGORY | category (lowercase: "shul") |
| SUBCATEGORY | subcategory |
| STREET_ADDRESS | address |
| CITY | city |
| PHONE | phone |
| WEBSITE | website |
| DENOMINATION_OR_SPECIALTY | denomination |
| ENGLISH_LEVEL | english_level |
| NOTES | description |
| SOURCE_URL | source_url |

- `geocode_status` defaults to `'pending'`
- `latitude`/`longitude` left null — will be geocoded by the existing `geocode-pois` edge function after insert

## Steps

1. **Insert 22 rows** into `map_pois` using the insert tool with proper field mapping (category lowercased to "shul", empty phone/website stored as null)
2. **Trigger geocoding** by invoking the `geocode-pois` edge function to fill in lat/lng for the new entries

## Cities Covered
- Beit Shemesh (7 shuls)
- Jerusalem (12 shuls)
- Netanya (1 shul)
- Ra'anana (1 shul)
- Rehovot (2 shuls — one has address needing verification)

No schema changes needed. No code changes needed.

