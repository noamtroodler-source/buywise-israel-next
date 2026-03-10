

# Fuzzy Neighborhood Search — Alias & Typo Tolerance

## Problem
Currently, neighborhood search uses exact substring matching (`name.toLowerCase().includes(query)`). Users typing common transliteration variants like "Rechavia" instead of "Rehavia", "Katamon" vs "Katamonim", or "Talpiyot" vs "Talpiot" get zero results.

## Approach
Create a neighborhood alias map and fuzzy matcher (mirroring the existing `cityMatcher.ts` pattern) and use it in all three places neighborhoods are searched:

1. **`src/lib/utils/neighborhoodMatcher.ts`** (new file) — Contains:
   - `neighborhoodAliases` map: canonical name → array of alternate spellings for ~40-50 neighborhoods that have common transliteration variants (focused on Jerusalem, Tel Aviv, and other key cities)
   - `neighborhoodMatchesQuery(name, query)` function using the same strategy as `cityMatchesQuery`: normalized substring → alias check → Levenshtein distance fallback
   - Examples: "Rehavia" → ["rechavia", "rechavya", "rekhavia"], "Nachlaot" → ["nahlaot", "nachalot", "nachlaoth"], "Talpiot" → ["talpiyot", "talpiyoth"], "Baka" → ["baq'a", "baqaa", "bakaa"], "Neve Tzedek" → ["neve tsedek", "neve zedek", "nevetzedek"]

2. **`src/components/filters/NeighborhoodSelector.tsx`** — Replace `.includes()` filtering with `neighborhoodMatchesQuery()` in both city-scoped and global modes (lines 42 and 89)

3. **`src/components/home/CitySearchInput.tsx`** — Replace the neighborhood `.includes()` filter (line 111) with `neighborhoodMatchesQuery()`

## Alias Coverage (key neighborhoods)
Jerusalem: Rehavia, Nachlaot, Talpiot, Baka, Arnona, Katamon, Meah Shearim, Ein Kerem, Bayit Vegan, Har Nof, Ramot, Pisgat Ze'ev, Givat Shaul, Kiryat Moshe, Sanhedria, Ma'alot Dafna, French Hill, Mamilla, Musrara, Geula, Abu Tor, Gilo, Malha, Ramat Eshkol

Tel Aviv: Neve Tzedek, Florentin, Kerem HaTeimanim, Jaffa/Yafo, Ramat Aviv, Bavli, Sarona, Shapira, HaTikva, Nahalat Binyamin

Other cities: Ramat Beit Shemesh variations, Kfar Saba neighborhoods, etc.

## No DB changes needed
All alias data lives client-side in the matcher utility — same pattern as the existing city aliases.

