

# Clean Up All Imported Data

## What We're Deleting

| Table | Count | Description |
|-------|-------|-------------|
| `import_job_items` | 868 rows | All crawled/scraped listing records |
| `import_jobs` | 9 rows | All import job records |
| `import_job_costs` | unknown | Cost tracking for imports |
| `properties` (where `source_url IS NOT NULL`) | 139 rows | All imported properties |
| Related records | varies | Favorites, views, inquiries, image hashes, etc. tied to those 139 properties |

The remaining ~3,110 manually-created properties are untouched.

## Execution Steps

### Step 1 -- Delete related records for imported properties
Use the data operation tool to delete from all child tables where `property_id` matches an imported property. Tables to clean (in order to respect foreign keys):

- `featured_performance`
- `featured_listings`
- `favorites`
- `guest_property_saves`
- `image_hashes`
- `inquiries`
- `property_inquiries`
- `property_views`
- `recently_viewed`
- `price_drop_notifications`
- `listing_reports`
- `location_module_events`
- `market_insight_cache`
- `duplicate_pairs` (where `property_a` or `property_b` matches)
- `listing_lifecycle` (where `entity_type = 'property'` and `entity_id` matches)
- `listing_price_history` (same pattern)
- `listing_status_history` (same pattern)

Each DELETE will use a subquery: `WHERE property_id IN (SELECT id FROM properties WHERE source_url IS NOT NULL)`.

### Step 2 -- Delete the 139 imported properties
```sql
DELETE FROM properties WHERE source_url IS NOT NULL;
```

### Step 3 -- Delete import pipeline data
```sql
DELETE FROM import_job_items;
DELETE FROM import_job_costs;
DELETE FROM import_jobs;
```

### Step 4 -- Reset de-duplication hashes
Clear `image_hashes` entries that belonged to imported properties (already handled in Step 1). This ensures future imports by real agencies won't hit false duplicate matches.

## No Code Changes Needed
The import feature code stays intact — only the data is wiped. When real agencies start importing, everything will work fresh with no stale duplicate flags.

