

# Phase 13: Hebrew City Aliases & Missing Cities

## Problem
The import pipeline's `CITY_ALIASES` has zero Hebrew names. When AI extracts a city like "תל אביב" from a Hebrew listing page, `matchSupportedCity()` returns `null` and the listing is rejected. Additionally, Rehovot and Rishon LeZion exist elsewhere in the codebase but are missing from the import pipeline's `SUPPORTED_CITIES`, `CITY_PRICE_RANGES`, and `CITY_RENTAL_RANGES`.

## Changes — Single File

**File:** `supabase/functions/import-agency-listings/index.ts`

### 1. Add Rehovot & Rishon LeZion to `SUPPORTED_CITIES` (line 18-25)

```
"Rehovot", "Rishon LeZion"
```

### 2. Add Hebrew names to `CITY_ALIASES` (lines 28-51)

Add Hebrew aliases for every supported city:

| City | Hebrew aliases to add |
|------|----------------------|
| Tel Aviv | תל אביב, תל אביב יפו, תל-אביב |
| Jerusalem | ירושלים |
| Haifa | חיפה |
| Ra'anana | רעננה |
| Herzliya | הרצליה |
| Netanya | נתניה |
| Beer Sheva | באר שבע, באר-שבע |
| Ashkelon | אשקלון |
| Ashdod | אשדוד |
| Ramat Gan | רמת גן, רמת-גן |
| Petah Tikva | פתח תקווה, פתח תקוה |
| Kfar Saba | כפר סבא |
| Modi'in | מודיעין, מודיעין מכבים רעות |
| Beit Shemesh | בית שמש |
| Eilat | אילת |
| Hod HaSharon | הוד השרון |
| Givat Shmuel | גבעת שמואל |
| Hadera | חדרה |
| Caesarea | קיסריה |
| Efrat | אפרת |
| Gush Etzion | גוש עציון |
| Ma'ale Adumim | מעלה אדומים |
| Mevaseret Zion | מבשרת ציון |
| Pardes Hanna | פרדס חנה, פרדס חנה כרכור |
| Zichron Yaakov | זכרון יעקב |
| Rehovot (new) | רחובות, rechovot |
| Rishon LeZion (new) | ראשון לציון, rishon lezion, rishon le zion |

### 3. Add Rehovot & Rishon LeZion to `DOMAIN_CITY_HINTS` (lines 54-82)

```
"rehovot": "Rehovot",
"rechovot": "Rehovot",
"rishon": "Rishon LeZion",
"rishonlezion": "Rishon LeZion",
```

### 4. Add to `CITY_PRICE_RANGES` (after line 149)

```
"Rehovot":        { min: 1_000_000, max: 4_000_000, sqm_min: 18_000, sqm_max: 30_000 },
"Rishon LeZion":  { min: 1_200_000, max: 5_000_000, sqm_min: 20_000, sqm_max: 35_000 },
```

### 5. Add to `CITY_RENTAL_RANGES` (after line 179)

```
"Rehovot":        { min: 2_500, max: 9_000 },
"Rishon LeZion":  { min: 3_000, max: 11_000 },
```

### 6. Also update `import-sold-transactions/index.ts`

Add Rehovot to the `normalizeCity` Hebrew map (it's already handling Rishon LeZion):
```
"רחובות": "Rehovot",
```

### 7. Update `cityMatcher.ts`

Add Rehovot and Rishon LeZion entries with their aliases for the frontend fuzzy search.

## No database migration needed
Cities are stored as plain text on the `properties` table — no enum or cities table constraint.

## Files to edit
- `supabase/functions/import-agency-listings/index.ts` — all 5 changes above
- `supabase/functions/import-sold-transactions/index.ts` — add Rehovot to Hebrew map
- `src/lib/utils/cityMatcher.ts` — add Rehovot & Rishon LeZion aliases

