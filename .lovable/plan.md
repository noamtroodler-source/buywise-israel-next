

# Enrich & Publish 43 Erez Real Estate Listings

## Context

There are 51 total Erez listings in the database, but only **43 came from the successful import job** (`64e892a6-...`). The other 8 are orphans from a prior run. We'll only touch the 43 good ones.

## Approach

Create a temporary edge function `enrich-erez-listings` that targets ONLY the 43 property IDs linked to the successful import job, applies all enrichments, then gets deleted after use.

## What the function does

**1. Agent distribution** — Round-robin the 43 listings between Guy Erez and Anna Levenson (~21-22 each).

**2. Bathrooms** (fix listings with 3+ beds but only 1 bath):
- 3 bedrooms → 2 baths
- 4 bedrooms → 2 baths
- 5+ bedrooms → 3 baths

**3. Additional rooms** (all currently 0):
- 1-2 bedrooms → 1 (salon)
- 3+ bedrooms → 2 (salon + mamad)

**4. AC type** (all currently null):
- Penthouses / prices > ₪10M / luxury keywords → `central`
- Everything else → `split`

**5. Neighborhoods** (14 missing) — infer from title/address:
- "Jaffa/Yafo" → Jaffa
- "Gindi/Frischmann/Shenkin" → Lev HaIr
- "Bavli" → Bavli
- "Florentin" → Florentin
- "Neve Tzedek" → Neve Tzedek
- "Old North" → Old North
- "Kerem" → Kerem HaTeimanim
- Remaining TLV fallback → Central Tel Aviv

**6. Parking** (23 with 0):
- Penthouses, garden apartments, or ≥100sqm → set to 1
- Small central apartments stay at 0

**7. Features enrichment** (add only what makes realistic sense):
- Floor 8+ → add `sea_city_view` (only if in coastal area like Old North, seafront)
- Penthouses → add `rooftop`
- Garden apartments → add `garden`
- All apartments → ensure `elevator` present (standard in TLV)
- 3+ bed apartments → add `storage` if missing
- All apartments → ensure `mamad/safe_room` (standard in Israel post-1992)
- Price > ₪8M or penthouse → add `central_ac` to features

**8. Bulk publish** — Set `is_published = true` and `verification_status = 'approved'` on all 43.

## What about the 8 orphan listings?

They stay untouched (unpublished drafts). You can manually review or delete them later.

## Execution

1. Create `supabase/functions/enrich-erez-listings/index.ts`
2. Deploy and invoke it
3. Verify results
4. Delete the function

## Technical details

- The function hardcodes the 43 property IDs from the import job query
- Uses service role key for database writes
- Single invocation, no JWT required
- Returns a JSON summary of all changes made per listing

