

## Cross-Source Dedup/Merge Pipeline — Plan

### Current State

**What already works:**
- Inline cross-source matching during import (address + fuzzy matching) — 469 properties already have merged_source_urls
- Source priority logic: structured data (Yad2) overwrites AI-extracted values; non-structured sources gap-fill only
- `detect-duplicates` edge function scans for pHash + address similarity, creates `duplicate_pairs` entries
- Admin UI to manually review/merge/dismiss pairs (105 pending pairs right now)
- `merge_properties()` DB function transfers inquiries, favorites, views, and unpublishes the loser

**What's missing:**
1. No scheduled/automated run of `detect-duplicates` — only triggered manually via admin "Scan Now" button
2. No auto-merge for high-confidence duplicates — every pair requires manual admin review
3. `merge_properties()` only unpublishes the loser; it does NOT merge fields (photos, description, features) from the loser into the winner
4. `detect-duplicates` limited to 2,000 properties per scan — won't scale to 10K+
5. No source trust ranking in the merge function

### Plan

#### 1. Upgrade `merge_properties()` DB function
- Before unpublishing the loser, enrich the winner with the loser's better data:
  - Longer description wins
  - Union features arrays
  - If winner has no coordinates but loser does, copy them
  - If winner has no address but loser does, copy it
  - Copy floor, year_built, size_sqm, neighborhood if winner is missing them
  - Merge `merged_source_urls` arrays from both
- Add source trust ranking: `yad2` > `madlan` > `website_scrape` for structured fields; longer/richer content wins for text fields

#### 2. Upgrade `detect-duplicates` edge function
- Paginate through ALL published properties (not just 2,000) using cursor-based pagination
- Add coordinate-based matching (haversine within 30m + same bedrooms + similar price = likely duplicate)
- Skip pairs that already exist in `duplicate_pairs` (any status) to avoid re-flagging dismissed pairs
- Add auto-merge for very high confidence pairs (score >= 90 AND same bedrooms AND price within 3%) — call `merge_properties()` directly, choosing the property with higher `data_quality_score` as winner

#### 3. Schedule daily cron job
- Add a `pg_cron` job to invoke `detect-duplicates` daily at 6:00 AM (after nightly scraping completes)
- This catches any duplicates that slipped through the inline import matching

#### 4. Improve admin UI
- Show which fields were merged and from which source in the `DuplicateCompareCard`
- Show `import_source` badge on each property mini card so admins can see which source each came from
- Display `merged_source_urls` count to show how many sources feed into each listing

### Technical Details

**Files to modify:**
- `supabase/functions/detect-duplicates/index.ts` — pagination, auto-merge, coordinate matching
- Migration: update `merge_properties()` function to include field-level merging with source trust
- `src/components/admin/DuplicateCompareCard.tsx` — add import_source badge
- `src/pages/admin/AdminDuplicates.tsx` — fetch import_source in property select, show merge stats
- SQL insert: add `detect-duplicates-daily` cron job

**Source trust ranking (used in merge):**
```text
Priority (highest first):
1. yad2       — structured API data, most reliable for price/size/rooms
2. madlan     — structured scrape, reliable for address/coordinates
3. website_scrape — AI-extracted, best for descriptions/features
```

**Auto-merge criteria (no admin review needed):**
- Score >= 90
- Same bedrooms
- Price within 3%
- Same city
- Winner = property with higher `data_quality_score`

