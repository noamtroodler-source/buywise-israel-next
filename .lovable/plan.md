

# Phase 15: Sync Intelligence — Price Change Detection & Removed Listing Flagging

## Problem
The current `sync-agency-listings` cron only discovers **new** URLs. It does not:
1. Re-check existing imported listings for **price changes** on the source website
2. Detect listings that have been **removed** (404/gone) from the agency site, which likely means "sold" or "rented"

## Approach

### A. New action: `check_existing` in `import-agency-listings`

Add a new action to the import edge function that:

1. **Receives** a list of `{ property_id, source_url, current_price }` objects
2. **Fetches** each URL via Firecrawl scrape (lightweight, markdown-only)
3. **Detects removal**: If the URL returns 404 or redirects to a listings index page → flag property as "potentially sold/rented"
4. **Detects price change**: Extract the price from the page content using a simple regex/AI extraction. If different from `current_price` → update the property price (which triggers existing `handle_price_reduction` and `log_property_price_change` triggers)
5. **Returns** a summary: `{ checked, price_changes, removed, errors }`

### B. Database migration

Add two columns to `properties`:
- `last_sync_checked_at` (timestamptz, nullable) — when this listing was last verified against its source
- `sync_status` (text, nullable, default null) — values: `null` (normal), `'removed'` (source URL 404), `'price_changed'` (auto-updated)

### C. Update `sync-agency-listings` orchestrator

After the existing discover+process flow, add a second pass:
1. Query all published properties for this agency that have a `source_url` and haven't been checked in the last 7 days
2. Send them in batches of 10 to the new `check_existing` action
3. The action handles price updates and removal flagging internally

### D. Price change flow (leverages existing infrastructure)

When a price change is detected:
- Update `properties.price` → triggers `handle_price_reduction()` (sets `original_price`, `price_reduced_at`)
- Triggers `log_property_price_change()` → inserts into `listing_price_history` with `change_reason: 'sync'`
- Triggers `track_property_lifecycle_price()` → updates `listing_lifecycle`
- Triggers `notify_price_drop()` → creates `price_drop_notifications` for users who favorited it

All of this is **already wired up** via existing DB triggers — the sync just needs to update the price.

### E. Removal detection flow

When source URL returns 404 or redirects to a non-property page:
- Set `sync_status = 'removed'` and `last_sync_checked_at = now()`
- Do NOT auto-unpublish — flag it for agent/admin review
- The agent dashboard can show a banner: "X listings may have been sold (source page removed)"

## Files to Edit

1. **Migration** — Add `last_sync_checked_at` and `sync_status` columns to `properties`
2. **`supabase/functions/import-agency-listings/index.ts`** — Add `check_existing` action handler (~80 lines)
3. **`supabase/functions/sync-agency-listings/index.ts`** — Add existing-listing check pass after discover+process

## Implementation Detail

### `check_existing` action (in import-agency-listings)

```
Input: { action: "check_existing", agency_id, items: [{ property_id, source_url, current_price }] }

For each item:
  1. Firecrawl scrape source_url (markdown only, timeout 15s)
  2. If error/404 → mark sync_status='removed', update last_sync_checked_at
  3. If success → extract price via regex (₪[\d,]+|NIS[\d,]+|(\d{1,3}(,\d{3})+))
  4. If extracted price differs from current_price by >1% → update properties.price
     (existing triggers handle history, notifications, lifecycle)
  5. Update last_sync_checked_at regardless
  
Return: { checked, price_changes: [{id, old, new}], removed: [id,...], errors: number }
```

### Updated `sync-agency-listings` flow

```
For each agency:
  1. [existing] Discover new URLs → process batches
  2. [NEW] Query properties WHERE agency_id = X 
     AND source_url IS NOT NULL 
     AND is_published = true
     AND (last_sync_checked_at IS NULL OR last_sync_checked_at < now() - interval '7 days')
     LIMIT 50
  3. Call check_existing in batches of 10
  4. Log results
```

No UI changes needed in this phase — the data flows through existing price tracking infrastructure. Phase 17 (Review UI) will surface the `sync_status = 'removed'` flag.

