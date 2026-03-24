

# Enrich All 105 JRE Listings — Edge Function

## Summary

Create a one-shot edge function `enrich-jre-listings` that updates all 105 listings under agency `0eb2a33b` with realistic metadata. Zero duplicates confirmed between JRE agencies.

## Current Data Gaps (105 listings)

| Gap | Count |
|---|---|
| Missing address | 87 |
| Missing AC type | 105 |
| Missing floor | 94 |
| No parking | 97 |
| Empty features | 33 |
| Price = 0 | 6 |
| No bathrooms | 1 |
| Unpublished | 105 |

## What the Edge Function Does (Single Pass)

### 1. Fix Zero Prices (6 listings)
Use neighborhood avg price/sqm from `sold_transactions` (Hebrew neighborhood mappings):
- Mamilla: ~₪37K/sqm → 240sqm penthouse ≈ ₪8.9M
- Nachlaot: ~₪44K/sqm → 550sqm luxury ≈ ₪24.2M
- City Center: ~₪48K/sqm → 360sqm/600sqm penthouses
- Arnona: ~₪28K/sqm → 139sqm/280sqm penthouses

Round to nearest ₪50K.

### 2. Addresses (87 missing)
Hardcoded neighborhood → street mapping for Jerusalem:

| Neighborhood | Streets |
|---|---|
| Old Katamon | Rachel Imenu, Bruria, Pierre Koenig, HaPalmach |
| Baka | Derech Beit Lechem, Yehuda, Rivka |
| German Colony | Emek Refaim, Lloyd George, Rachel Imenu |
| City Center | Jaffa, King George, Ben Yehuda, HaNeviim |
| Rehavia | Azza, Ramban, Alfasi, Keren Kayemet |
| French Hill | Levi Eshkol, Churchill |
| Arnona | Shalom Yehuda, Haim Hazaz |
| Talbiya | Jabotinsky, Dubnov, Hovevei Tziyon |
| Mamilla | King Solomon, Shlomtzion HaMalka |
| Ramat Eshkol | Paran, Levi Eshkol |
| Musrara | HaAyin Het, Shmuel HaNavi |
| Katamonim | San Martin, Guatemala |
| Maalot Dafna | Bar Ilan, Paran |
| Mekor Haim | Pierre Koenig, Mekor Haim |
| + all other neighborhoods... |

Deterministic street selection via property ID hash. Even house numbers 2–120.

### 3. Heuristic Metadata

**Bathrooms** (fix 1 missing): 1-2 bed → 1, 3-4 bed → 2, 5-6 bed → 3, 7+ → 4

**Additional rooms**: 1-2 bed → 1, 3+ bed → 2

**AC type**: Penthouses or price > ₪10M → `central`, all others → `split`

**Parking**: Penthouses/houses/garden apts/≥100sqm → 1, price > ₪12M → 2, small units → 0

**Floor / total_floors**:
- Garden apartments → floor 0, total 3
- Penthouses → floor 6–12 (size-based), total = floor
- Houses/duplexes → floor 0, total 2–3
- Regular apartments → floor 2–5 (hash), total = floor + 2

**Features** (ensure all have baseline):
- All: `elevator`, `mamad/safe_room`
- Penthouses: add `rooftop`, `panoramic_view`
- Garden apartments: add `garden`
- 3+ bed: add `storage`
- Anglo neighborhoods (Baka, German Colony, Old Katamon, Rehavia, Talbiya): add `sukkah_balcony`
- Price > ₪10M: add `underfloor_heating`
- High floor (6+): add `city_view`

### 4. Publish All
Set `is_published = true` and `verification_status = 'approved'`.

## Files

1. **New**: `supabase/functions/enrich-jre-listings/index.ts` — one-shot enrichment function
2. No frontend changes

## Execution
Deploy automatically, invoke once via the edge function tools, verify results, done.

