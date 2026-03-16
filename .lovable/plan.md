

## Plan: Roster Cleanup + New Neighborhoods + Bulk Approve/Reject Pending Mappings

### What we're doing

**1. Remove duplicate "South Pardes Hanna" from Pardes Hanna roster**
- Keep "Pardes Hanna South" (has boundary coords)
- Remove "South Pardes Hanna" (duplicate, no boundary coords)
- Update via SQL: read current JSON, filter out the duplicate, write back

**2. Add "Shikamim" to Ashkelon roster**
- Add `{ name: "Shikamim", name_he: "שקמים", boundary_coords: [] }` to Ashkelon's neighborhoods JSON array

**3. Add "Neve Sharet" to Zichron Yaakov roster**
- Add `{ name: "Neve Sharet", name_he: "נווה שרת", boundary_coords: [] }` to Zichron's neighborhoods JSON array

**4. Bulk approve 18 pending mappings**
All pending mappings EXCEPT Shimshon→שקמים and Neve Shamir→נווה שרת:
- Barnea ×3 (Ashkelon)
- City Center (Ashkelon)
- City Center (Ashdod)
- Ganei Eilat (Eilat)
- Armon HaNatziv, Ramat Beit HaKerem (Jerusalem)
- Shikun Amidar (Kfar Saba)
- Blue Bay, Ramat Efal, South Netanya (Netanya)
- Pardes Hanna South + South Pardes Hanna (Pardes Hanna) — both approved for now
- Jaffa ×4 (Tel Aviv)

**5. Reject 2 incorrect mappings**
- Shimshon → שקמים (Ashkelon) → reject
- Neve Shamir → נווה שרת (Zichron) → reject

**6. Run mapping for new neighborhoods**
- Trigger `map-neighborhoods` for Ashkelon and Zichron Yaakov to pick up Shikamim and Neve Sharet
- Auto-approve any exact/high matches

### Files changed
None — all changes are data updates (city roster JSON + mapping statuses) via database operations and edge function calls.

