

# Clean Up Worth Watching Database

## Summary

Clean up the `city_market_factors` table by deactivating outdated entries, fixing sort order conflicts, and reframing negative-toned content to be more constructive for international buyers.

---

## Changes Overview

| Action | Count | Cities Affected |
|--------|-------|-----------------|
| Deactivate dated entries | 7 | Nahariya, Yokneam, Hadera, Caesarea |
| Fix sort_order conflicts | 4 | Hadera, Caesarea |
| Reframe negative tone | 2 | Beer Sheva, Givat Shmuel |

---

## 1. Deactivate Dated Historical Entries

These entries reference events from 2006-2009 that are no longer actionable for current buyers:

| City | Title | Reason to Deactivate |
|------|-------|---------------------|
| Nahariya | Second Lebanon War Impact (2006) | 20-year-old event, no longer relevant |
| Nahariya | Beach Promenade Development | Vague timing, unclear status |
| Yokneam | Golf Course Development Stalled | 2009 event, outdated |
| Hadera | Coal Plant Transition | Already in progress, not "worth watching" |
| Caesarea | Golf Course Changes (2009) | 17-year-old event |
| Caesarea | Historical Value Retention | Generic statement, not specific insight |
| Caesarea | Exclusive Community Character | Description, not actionable market factor |

```sql
UPDATE city_market_factors 
SET is_active = false 
WHERE id IN (
  -- Nahariya dated entries
  SELECT id FROM city_market_factors 
  WHERE city_slug = 'nahariya' 
  AND (title ILIKE '%lebanon war%' OR title ILIKE '%beach promenade%'),
  
  -- Yokneam stalled project
  SELECT id FROM city_market_factors 
  WHERE city_slug = 'yokneam' AND title ILIKE '%golf course%',
  
  -- Hadera coal plant (already happening)
  SELECT id FROM city_market_factors 
  WHERE city_slug = 'hadera' AND title ILIKE '%coal plant%',
  
  -- Caesarea low-value entries
  SELECT id FROM city_market_factors 
  WHERE city_slug = 'caesarea' 
  AND (title ILIKE '%golf course%' OR title ILIKE '%historical value%' OR title ILIKE '%exclusive community%')
);
```

---

## 2. Fix Sort Order Conflicts

Reassign sort_order values to ensure proper prioritization:

**Hadera** (currently has duplicates at sort_order 1 and 2):
| Current | New | Title |
|---------|-----|-------|
| 1 | 1 | Light Rail Extension |
| 1 | 2 | Tech Sector Growth |
| 2 | 3 | Affordable Entry Point |
| 2 | 4 | Young Family Migration |

**Caesarea** (after deactivating low-value entries):
| Current | New | Title |
|---------|-----|-------|
| 1 | 1 | (Top priority item) |
| 2 | 2 | (Second priority) |
| etc. | etc. | Sequential ordering |

```sql
-- Fix Hadera sort_order conflicts
UPDATE city_market_factors 
SET sort_order = 2 
WHERE city_slug = 'hadera' AND title ILIKE '%tech sector%';

UPDATE city_market_factors 
SET sort_order = 3 
WHERE city_slug = 'hadera' AND title ILIKE '%affordable entry%';

UPDATE city_market_factors 
SET sort_order = 4 
WHERE city_slug = 'hadera' AND title ILIKE '%young family%';
```

---

## 3. Reframe Negative-Toned Entries

**Beer Sheva - "Speculative Bubble Warning"**

| Field | Before | After |
|-------|--------|-------|
| Title | Speculative Bubble Warning | Market Stabilizing After 2024 Surge |
| Description | Rapid 2024 price increases may not be sustainable. Exercise caution with premium purchases. | After rapid 2024 gains, prices are stabilizing. Good time to assess long-term value in established neighborhoods. |
| Icon | policy | infrastructure |

**Givat Shmuel - "Post-War Price Correction"**

| Field | Before | After |
|-------|--------|-------|
| Title | Post-War Price Correction | Entry Point Opportunity |
| Description | 5-8% price softening since Oct 2023 creates potential entry points for buyers. | Recent price adjustments of 5-8% may offer entry points in this high-demand tech corridor city. |

```sql
-- Reframe Beer Sheva entry
UPDATE city_market_factors 
SET 
  title = 'Market Stabilizing After 2024 Surge',
  description = 'After rapid 2024 gains, prices are stabilizing. Good time to assess long-term value in established neighborhoods.',
  icon = 'infrastructure'
WHERE city_slug = 'beer-sheva' AND title ILIKE '%bubble%';

-- Reframe Givat Shmuel entry
UPDATE city_market_factors 
SET 
  title = 'Entry Point Opportunity',
  description = 'Recent price adjustments of 5-8% may offer entry points in this high-demand tech corridor city.'
WHERE city_slug = 'givat-shmuel' AND title ILIKE '%correction%';
```

---

## Implementation Steps

1. **Deactivate dated entries** - Set `is_active = false` for 7 historical/low-value entries
2. **Fix sort conflicts** - Reassign sort_order values in Hadera and Caesarea
3. **Reframe tone** - Update title and description for Beer Sheva and Givat Shmuel entries

---

## Result

| Metric | Before | After |
|--------|--------|-------|
| Total active factors | ~130 | ~123 |
| Dated entries (pre-2020) | 7 | 0 active |
| Sort order conflicts | 4 | 0 |
| Negative-toned entries | 2 | 0 |

All changes are database-only. No frontend code changes required since the component already filters by `is_active = true` and orders by `sort_order`.

