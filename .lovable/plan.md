

# Populate Comprehensive Neighborhood Names for All 25 Cities

## Current State
Every city has neighborhood data but it's very sparse — Jerusalem has only 4 (Old City, German Colony, Rehavia, Katamon), Tel Aviv has 5, most others have 3-5. This makes the new neighborhood filter nearly useless for real users.

## Approach
Use the existing `bulk-update-neighborhoods` edge function to update all 25 cities with comprehensive, Anglo-standard neighborhood lists. No boundary coords for now (per your request to skip that part) — empty arrays for `boundary_coords` so the text-based filter works immediately.

## Data Source
I'll compile neighborhood lists using internationally recognized English names — the names Anglos/internationals actually use when searching for property. Priority order: Jerusalem first (most critical), then Tel Aviv, Beit Shemesh, Ra'anana, Modi'in, Netanya, Herzliya, Haifa, and the rest.

## Jerusalem (expanding from 4 → ~30+)
Adding: Talpiot, Arnona, Baka, Abu Tor, Ein Kerem, Malha, Givat Shaul, Bayit Vegan, Ramot, Pisgat Ze'ev, Neve Ya'akov, Har Nof, Kiryat Moshe, Nachlaot, Meah Shearim, French Hill, Ramat Eshkol, Givat HaMivtar, Ma'alot Dafna, Sanhedria, Ir Gannim, Kiryat Menachem, Pat, Gilo, East Talpiot, Ramat Shlomo, Ramot Alon, Holyland, Nayot, and more — keeping existing 4.

## Tel Aviv (expanding from 5 → ~20+)
Adding: Sarona, Kerem HaTeimanim, Jaffa, Ramat Aviv, Ramat HaHayal, Bavli, Park HaYarkon area, HaTikva, Shapira, Montefiore, Kiryat Shalom, Nahalat Binyamin, Ramat Aviv Gimel, Neve Sha'anan, Yad Eliyahu, and more.

## All Other Cities
Similar expansion to 8-20+ neighborhoods per city depending on city size, using Anglo-standard names.

## Implementation
1. Build complete JSON data for all 25 cities with `name`, `name_he`, and empty `boundary_coords: []`
2. Call the existing `bulk-update-neighborhoods` edge function (or direct updates) to write to the `cities.neighborhoods` JSONB column
3. Preserve any existing `boundary_coords` data for neighborhoods that already have it
4. Verify the data loads correctly in the new neighborhood filter

## What Won't Change
- No boundary coordinate work (as requested)
- No schema changes needed — same JSONB structure
- The filter UI code from the previous implementation stays as-is

