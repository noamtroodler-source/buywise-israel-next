

# Phase N3: Price Tier Corrections & Anglo Tag Updates

---

## 1. Fix 3 Incorrect Price Tier Classifications (Database)

Update `featured_neighborhoods` JSONB in the `cities` table for these neighborhoods:

| City | Neighborhood | Current Tier | Correct Tier |
|------|-------------|-------------|-------------|
| Tel Aviv | Florentin | budget | mid-range |
| Jerusalem | Katamon | mid-range | premium |
| Jerusalem | German Colony / Baka | premium | ultra-premium |

Three separate UPDATE statements using JSONB manipulation to find and update the `price_tier` field within the `featured_neighborhoods` array.

## 2. Add 7 Missing Anglo Neighborhoods

Update `src/lib/angloNeighborhoodTags.ts`:

- **Jerusalem** (line 9-11): Add `'French Hill'`, `'Talpiot'`, `'Armon HaNatziv'`
- **Beit Shemesh** (line 18): Add `'RBS Bet'`, `'RBS Hey'`, `'Neve Shamir'`
- **Gush Etzion** (line 21): Add `"Ma'ale Amos"`, `'Meitzad'`

## 3. Review 2 Flagged Anglo Tags

- **Katamonim** — Keep. It's a real Jerusalem neighborhood with a growing Anglo presence. No code change needed.
- **Kikar HaSharon** — Keep. It's the central Ra'anana square area and a legitimate residential zone. No change needed.

## Execution Order

1. Update `angloNeighborhoodTags.ts` with new entries
2. Update database: Florentin tier → mid-range
3. Update database: Katamon tier → premium
4. Update database: German Colony/Baka tier → ultra-premium

