

## Revamp Mock Listing Dates

Redistribute `created_at` (and `updated_at`) across all ~3,100 mock listings to create a realistic, active marketplace feel. The majority keep older dates, but a meaningful chunk becomes fresh.

### Target Distribution

| Age Bucket | Count (~) | % | Description |
|---|---|---|---|
| 0-1 days | ~60 | 2% | Just listed today/yesterday -- triggers "hot" badges |
| 2-3 days | ~90 | 3% | Very fresh -- still shows "hot" badge (<=3 days) |
| 4-7 days | ~150 | 5% | Recent week listings |
| 1-2 weeks | ~450 | 15% | Moderately fresh |
| 2-4 weeks | ~750 | 24% | Standard |
| 1-3 months | ~1,600 | 51% | Bulk of listings, keeps current feel |

### Technical Details

**Single SQL migration** that randomly selects listings and updates their `created_at` to a random timestamp within each bucket. Uses `random()` for natural variation within each bucket (not all at the exact same timestamp).

```sql
-- Bucket 1: ~60 listings -> 0-24 hours ago
UPDATE properties SET 
  created_at = now() - (random() * interval '24 hours'),
  updated_at = now() - (random() * interval '12 hours')
WHERE id IN (
  SELECT id FROM properties ORDER BY random() LIMIT 60
);

-- Bucket 2: ~90 listings -> 1-3 days ago
-- Bucket 3: ~150 listings -> 4-7 days ago
-- ... and so on for each bucket
-- Remaining listings untouched (keep current dates)
```

Each bucket selects from listings NOT already assigned to a fresher bucket using a CTE approach to avoid overlap.

**No schema changes. No new files. Single database migration.**

### Impact

- Property markers on the map will show fire emoji "hot" badges for ~150 listings (those <=3 days old)
- "Days on market" displays will show realistic variety ("Today", "1 day", "5 days", "3 weeks", "2 months")
- Sort by "newest" will surface genuinely fresh-looking listings
- The `RecentlyViewedRow` and search results will feel like an active marketplace

