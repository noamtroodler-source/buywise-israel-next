

## Plan: Create 7 Missing Cities + Rental Verification Reference Table

### Step 1 — Create `city_rental_verification` table (migration)

A reference/audit table storing verified rental and yield data with source attribution:

| Column | Type | Purpose |
|--------|------|---------|
| `id` | uuid PK | |
| `city_slug` | text (FK cities.slug) | Links to city |
| `room_count` | integer | 3, 4, or 5 |
| `rent_min` | numeric | Verified min rent |
| `rent_max` | numeric | Verified max rent |
| `rent_avg` | numeric (nullable) | Average if available |
| `yield_min` | numeric (nullable) | Yield range min % |
| `yield_max` | numeric (nullable) | Yield range max % |
| `source` | text | e.g. "Madlan, GPG" |
| `verified_at` | date | When data was checked |
| `status` | text | "verified", "estimate", "outdated" |
| `notes` | text (nullable) | Free-form notes |
| `created_at` / `updated_at` | timestamptz | |

Unique constraint on `(city_slug, room_count)` so each city+room combo has one active record. No RLS needed — this is admin reference data, read-only for public display.

### Step 2 — Create 7 missing city entries (data insert)

Insert into `cities` table for: **Bat Yam, Givatayim, Holon, Rosh HaAyin, Givat Ze'ev, Nahariya, Shoham** — with the rental ranges, yield data, and regions from the Perplexity verification report.

### Step 3 — Populate verification table (data insert)

Insert all ~37 cities' rental data into `city_rental_verification` — both the existing 25+ cities and the 7 new ones. Each city gets up to 3 rows (3-room, 4-room, 5-room). One additional row per city for yield data (room_count = 0 as a convention for city-level yield). Source tagged as "Madlan, GPG" with verified_at = 2025-03-17 and status = "verified".

### Step 4 — Update City type

Add no new fields to `City` interface — the verification table is backend-only reference data. The `cities` table columns already have all the display fields.

### Summary

- 1 new table (`city_rental_verification`) — ~120 rows of verified data
- 7 new city rows in `cities`
- No UI changes in this step (BuyWise Estimate labels come next)
- Full audit trail of what was verified, when, and from which source

