

## Plan: Organize CBS Data into Database Tables

You have three CBS datasets that need proper homes in the database. Here's the current state and what to do:

### Current State (the mess)

```text
TABLE                  | ROWS | WHAT'S IN IT                          | PROBLEM
-----------------------|------|---------------------------------------|---------------------------
market_data            | 109  | Mixed: some transactions, some quarterly | Only 9 cities, no room breakdowns, sparse
historical_prices      | 718  | Annual avg prices per city (2000-2025)  | No room-level breakdown, manual notes
city_canonical_metrics | ~25  | Snapshot metrics per report version      | Point-in-time only, no history
cities                 | ~25  | Current metrics (just updated from CBS)  | Good — single source of truth ✓
rental_prices          | ?    | Room-level rental ranges                | Static, no time series
```

Your CSVs provide **much richer, authoritative data** that doesn't cleanly fit into any existing table.

### What to Build: 2 New Tables

#### Table 1: `city_price_history`
**Source:** `market_data-3.csv` (1,625 rows)
**Purpose:** Quarterly average transaction prices by city AND room count (3/4/5), 2020-2025, with national comparison

```text
city_en        TEXT NOT NULL
rooms          INTEGER NOT NULL (3, 4, or 5)
year           INTEGER NOT NULL
quarter        INTEGER NOT NULL (1-4)
avg_price_nis  NUMERIC
country_avg    NUMERIC
created_at     TIMESTAMPTZ DEFAULT now()

UNIQUE(city_en, rooms, year, quarter)
```

**What this unlocks:**
- 5-year price trend charts on city pages (by room count)
- "vs national average" comparison lines
- YoY growth calculations per room type
- Investment timing analysis ("when did prices peak/dip?")

#### Table 2: `neighborhood_price_history`
**Source:** `neighborhood_data-2.csv` (52,398 rows)
**Purpose:** Quarterly prices by neighborhood, room count, 2020-2025, with neighborhood-level yield and YoY

```text
city_en              TEXT NOT NULL
neighborhood_he      TEXT NOT NULL
neighborhood_id      TEXT NOT NULL
rooms                INTEGER NOT NULL
year                 INTEGER NOT NULL
quarter              INTEGER NOT NULL
avg_price_nis        NUMERIC
latest_avg_price     NUMERIC
yoy_change_pct       NUMERIC
price_increase_pct   NUMERIC  (overall trend)
rental_yield_pct     NUMERIC
created_at           TIMESTAMPTZ DEFAULT now()

UNIQUE(neighborhood_id, rooms, year, quarter)
```

**What this unlocks:**
- Neighborhood-level price charts on city pages
- "Hottest neighborhoods" rankings by YoY growth
- Neighborhood yield comparisons for investors
- Property page context: "This neighborhood averaged ₪X for 4-room apartments"
- AI market insights grounded in real neighborhood data

### What NOT to Do

- **Don't touch `cities` table** — already updated with CBS summary data, stays as single source of truth for current metrics
- **Don't modify `historical_prices`** — it has 2000-2025 annual data that's still useful for long-range views. The new tables add quarterly granularity
- **Don't modify `market_data`** — legacy table, leave it but stop relying on it for new features

### Data Import Strategy

1. Create both tables via migration
2. Use an edge function to accept CSV data and bulk-insert (the CSVs are too large for direct client inserts)
3. No RLS needed — this is public CBS data, read-only for all users

### Summary

| Step | Action |
|------|--------|
| 1 | Create `city_price_history` table (migration) |
| 2 | Create `neighborhood_price_history` table (migration) |
| 3 | Build `import-cbs-data` edge function to accept and insert CSV data |
| 4 | Import `market_data-3.csv` → `city_price_history` (~1,625 rows) |
| 5 | Import `neighborhood_data-2.csv` → `neighborhood_price_history` (~52,398 rows) |

Once this data is in the database, we can build trend charts, neighborhood comparisons, investment scoring, and AI insight enrichment on top of it.

