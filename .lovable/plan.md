

# Hide Mock Listings — Keep Only JRE, City Zen, Erez

## What
Unpublish all properties that don't belong to the 3 real agencies, so they stop appearing everywhere on the site. Mock projects remain untouched.

## How
Single database migration that sets `is_published = false` on all properties whose agent belongs to a non-real agency.

### SQL Logic
```sql
UPDATE properties
SET is_published = false
WHERE agent_id IN (
  SELECT ag.id FROM agents ag
  WHERE ag.agency_id NOT IN (
    '0eb2a33b-a768-4204-ba75-29de29d6da2a',  -- JRE
    '9361592e-c7b8-49a6-9a21-8349b5c40719',  -- City Zen
    'cf4682bd-8ade-48a9-928e-e6770f592334'    -- Erez
  )
)
AND is_published = true;
```

This affects ~2,900+ mock listings across 14 mock agencies. All existing queries already filter by `is_published = true`, so no code changes needed.

### Impact
- **Homepage featured**: Will only show JRE/City Zen/Erez properties
- **Listings page / map search**: Same — mock listings hidden
- **Projects**: Untouched (separate `projects` table)
- **Reversible**: Can set `is_published = true` again anytime to bring them back

## Files
- **Migration only** — no frontend code changes needed

