

# Automated Batch Geocoding Cron Job

## What this does
Sets up an automatic timer that calls your existing `batch-geocode-sold` edge function every 10 minutes. Each run geocodes ~200 transactions. After ~12-13 hours, all ~15,200 ungeooded transactions will have coordinates, and the "Recently Sold Nearby" section will show comps for far more listings.

## Changes

### 1. Create a new edge function: `auto-geocode-sold`
A lightweight function that doesn't require admin auth (called by cron, not a user). It will:
- Use the service role key directly (no user auth needed since it's an internal cron call)
- Validate via a simple shared secret or just rely on the service role
- Call the same geocoding logic from `batch-geocode-sold` (process 200 records per run)
- Return stats (geocoded count, remaining count)
- **Auto-stop**: When 0 remaining, it just returns immediately (no wasted API calls)

### 2. Register a pg_cron job
Enable `pg_cron` and `pg_net` extensions, then schedule the function to run every 10 minutes:
```
every 10 minutes → POST to auto-geocode-sold → geocode 200 records → repeat
```

### 3. Add config entry
Add `[functions.auto-geocode-sold]` with `verify_jwt = false` to `config.toml`.

## Cost & Safety
- Stays within Google Maps free tier (40,000 requests/month; ~15,200 total needed)
- Each run self-limits to 200 records with rate limiting between requests
- Automatically idles when no ungeooded records remain

## Timeline
- ~15,200 records ÷ 200 per run = 76 runs
- 76 runs × 10 min = ~12.5 hours to complete

