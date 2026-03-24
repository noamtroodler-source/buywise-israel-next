

# Enrich City Zen Listings + AI Cover Photo Selection

## Current State
- **84 listings** total under City Zen agency (`9361592e`), 1 agent ("Ido")
- Primarily in **Netanya** (55), **Kfar Saba** (10), **Hod HaSharon** (11), plus a few in Pardes Hanna and Tel Aviv
- Mix: 41 apartments, 21 houses, 10 penthouses, 4 cottages, 3 garden apartments, 3 duplexes, 2 mini penthouses

## Data Gaps

| Gap | Count |
|---|---|
| Missing address | 40 |
| Missing AC type | 84 (all) |
| Missing bathrooms | 6 |
| No parking | 25 |
| Unpublished | 84 (all) |
| additional_rooms = 0 | many (need realistic values) |
| Missing total_floors | most houses/cottages |

## Plan — Two-Phase Edge Function

### Phase 1: `enrich-cityzen-listings` (Heuristic Enrichment)

Same proven pattern as JRE enrichment, adapted for Sharon/Netanya market:

**Addresses** (40 missing): Neighborhood → street mapping for Netanya, Kfar Saba, Hod HaSharon:

| Neighborhood | Streets |
|---|---|
| Ir Yamim | Ehud Manor, Nili, Lev HaIr |
| Ramat Poleg | Israel Galili, Ramat Poleg, HaOren |
| Kiryat HaSharon | Jabotinsky, Nordau, Herzl |
| Agamim | Agamim, HaYarkon |
| Nof HaTayelet | Sderot Nitza, HaTayelet |
| Galei Yam / Gali Hayam | Exodus, Sderot Ben Gurion |
| Even Yehuda | HaRishonim, HaMeyasdim |
| City Center Netanya | Herzl, Dizengoff, Smilansky |
| + other neighborhoods... |

**Bathrooms**: Same heuristic (1-2 bed → 1, 3-4 → 2, 5-6 → 3, 7+ → 4). Fixes 6 listings.

**Additional rooms**: Override 0 values — 1-2 bed → 1, 3+ bed → 2.

**AC type**: Houses/penthouses/price > ₪8M → `central`, others → `split` (Sharon market slightly lower threshold than Jerusalem).

**Parking**: Houses/cottages → 2, penthouses/garden apts/≥120sqm → 1, small units → 0. Already-set values preserved.

**Total floors**: Houses/cottages → 2, duplexes → 3. Apartments keep existing values.

**Features**: Baseline `elevator`, `mamad/safe_room`. Houses get `garden`, `private_entrance`. Penthouses get `rooftop`, `panoramic_view`. Coastal Netanya neighborhoods (Ir Yamim, Nof HaTayelet, Galei Yam) get `sea_view`. High floor (8+) get `city_view`. Price > ₪8M get `underfloor_heating`.

**Hebrew neighborhood cleanup**: Normalize Hebrew-only neighborhoods to English (e.g., `צפון מערב מרכז העיר` → `North West City Center`).

**Publish all**: `is_published = true`.

### Phase 2: AI Vision Cover Photo Selection

Same approach as JRE — use Gemini 2.5 Flash to evaluate first 8 images per listing, pick the best "curb appeal" cover, move to index 0. Process via Python script in batches.

81 of 84 listings have multiple images to evaluate.

## Files

1. **New**: `supabase/functions/enrich-cityzen-listings/index.ts` — one-shot enrichment
2. **Script**: `/tmp/pick_covers_cityzen.py` — AI vision batch processing (temporary)
3. No frontend changes

## Execution
1. Deploy and invoke enrichment function once
2. Run AI vision script in batches (~9 invocations for 81 multi-image listings)
3. Apply reorder updates
4. Delete temporary function and scripts

