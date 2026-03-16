

# Phase 2: Agency Import Pipeline — Review UI, Rental Support, CMS Detection, Incremental Sync

## What goes in Phase 2 vs Phase 3

**Phase 2 (now):**
1. Review UI with side-by-side source vs parsed data
2. Rental listing support (remove resale-only filter, add listing_type toggle)
3. WordPress/CMS structured data detection (JSON-LD, WP REST API)
4. Incremental sync (scheduled re-scan of agency websites)

**Deferred to Phase 3:**
- Apify Yad2 adapter (needs external account + API key)
- Image pHash deduplication (complex, diminishing returns given placeholder detection already works)
- Cross-source dedup Tier 3 (needs multiple sources active first)

---

## 1. Review UI — Side-by-Side Import Review

**New page**: `/agency/import/:jobId/review`

Agents see each imported item with:
- Left panel: source URL (iframe or screenshot) + raw extracted JSON
- Right panel: editable form pre-filled with parsed data, confidence score badge, validation warnings
- Actions per item: Approve (submit for review), Edit & Approve, Skip/Delete
- Bulk actions: Approve All (confidence 80+), Skip All Failed
- Filter tabs: All | Pending Review | Approved | Skipped/Failed
- Confidence score color coding: green (80+), yellow (40-79), red (<40)

**Changes:**
- New component `src/pages/agency/AgencyImportReview.tsx`
- New component `src/components/agency/ImportReviewCard.tsx`
- Route added in `App.tsx`
- Link from `AgencyImport.tsx` "Review Imported" button
- Hook `useImportJobItems` already exists — extend with update mutation

**Edge function change:** Add `action: 'approve_item'` to `import-agency-listings` that updates a job item's extracted data and sets status to `done`, inserting/updating the property.

---

## 2. Rental Listing Support

Currently `isNonResalePage()` skips rentals and `validatePropertyData()` rejects `for_rent`. This needs to become configurable.

**Changes in edge function:**
- Add `import_type` parameter to discover/process actions: `"resale"` (default) | `"rental"` | `"all"`
- Store `import_type` on `import_jobs` table (new column)
- When `import_type` includes rental: skip the rental pre-filter and rental validation error
- Keep the price < 20K filter but change from error to warning when importing rentals

**DB migration:**
```sql
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS import_type text NOT NULL DEFAULT 'resale';
```

**UI change in `AgencyImport.tsx`:**
- Add toggle/select before discovery: "Import type: Resale | Rental | Both"
- Pass to discover/process calls

---

## 3. WordPress/CMS Structured Data Detection

Before falling back to AI extraction, check if the page has structured data we can parse directly (higher accuracy, no AI cost).

**New detection in `processOneItem` (after scrape, before AI):**

1. **JSON-LD detection**: Parse `<script type="application/ld+json">` from HTML for `RealEstateListing`, `Product`, or `Offer` schemas
2. **WordPress REST API**: If domain has `/wp-json/` endpoint, try fetching listing data from WP REST API
3. **Open Graph tags**: Extract `og:title`, `og:description`, `og:image` as supplementary data

If structured data is found, merge it with AI extraction (structured data takes priority for matching fields), boosting confidence score.

**Changes:**
- Request `formats: ["markdown", "links", "html"]` from Firecrawl (add `html` format)
- New function `extractStructuredData(html)` that returns partial listing data
- Merge structured data with AI extraction results
- Boost confidence score by +10 when structured data confirms AI fields

---

## 4. Incremental Sync

Allow agencies to schedule automatic re-scans of their website to pick up new listings.

**DB migration:**
```sql
ALTER TABLE public.import_jobs ADD COLUMN IF NOT EXISTS is_incremental boolean NOT NULL DEFAULT false;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS auto_sync_url text;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS auto_sync_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;
```

**New edge function: `sync-agency-listings`**
- Triggered by cron (daily at 2 AM)
- For each agency with `auto_sync_enabled = true`:
  - Calls `handleDiscover` with the agency's `auto_sync_url`
  - If new URLs found, auto-processes them (same pipeline)
  - Updates `last_sync_at`

**UI in `AgencyImport.tsx`:**
- Toggle: "Auto-sync: check for new listings daily"
- Shows last sync time
- Can manually trigger sync

---

## Files Changed

1. **`supabase/functions/import-agency-listings/index.ts`** — Rental support toggle, structured data detection, approve_item action, import_type handling
2. **`src/pages/agency/AgencyImportReview.tsx`** — New review page
3. **`src/components/agency/ImportReviewCard.tsx`** — Side-by-side review card
4. **`src/pages/agency/AgencyImport.tsx`** — Import type toggle, auto-sync toggle, review link
5. **`src/hooks/useImportListings.tsx`** — Add approve/update mutations, import_type param
6. **`src/App.tsx`** — New route
7. **`supabase/functions/sync-agency-listings/index.ts`** — New cron-triggered sync function
8. **DB migration** — `import_type` on import_jobs, sync columns on agencies

