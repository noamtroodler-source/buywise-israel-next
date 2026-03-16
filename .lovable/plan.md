## Phase 1: Founding Partner Enrollment — Implemented ✅

All changes from the plan have been implemented:

1. **DB Migration** — Added `is_founding_partner`, `payplus_customer_id`, `payplus_subscription_id` to `subscriptions`; `payplus_subscription_id` to `featured_listings`. Updated FOUNDING2026 promo code (max_redemptions=15, cleared old discount/credit data).
2. **`enroll-founding-partner` edge function** — 15-cap enforcement, trial creation (60 days), founding_partners insert, first month credit grant, promo redemption tracking.
3. **`check-trial-expirations` edge function** — Daily cron (6 AM UTC) expires trialing subscriptions past trial_end.
4. **`useFoundingSpots` hook** — Live spots remaining counter querying founding_partners.
5. **`FoundingProgramSection`** — Updated benefits (2mo free, 3 featured/mo, early access, case study), spots counter badge.
6. **`FoundingProgramModal`** — Updated benefits, spots counter, activates enrollment flow.
7. **`Pricing.tsx`** — FOUNDING2026 code routes to `enroll-founding-partner` instead of Stripe; CTA changes to "Activate Founding Program".
8. **`CheckoutSuccess.tsx`** — Founding partner variant with trial end date and featured listings CTA.
9. **`grant-monthly-featured-credits`** — Already has 2-month duration cap logic.
10. **`PlanCard`** — Added `ctaLabel` prop for custom CTA text.

### Deferred (PayPlus not yet set up):
- `payplus-checkout`, `payplus-webhook`, `manage-billing` edge functions
- `list-invoices` PayPlus integration
- Featured listing ₪299/mo PayPlus recurring charge
- Trial-to-paid automatic charge initiation

## Phase 2: CBS Data Organization — Implemented ✅

**Data Source:** All data in these tables originates from **Nadlan.gov.il — Ministry of Justice, Israel** (official government property transaction records). This is the same authoritative source used for `sold_transactions`.

1. **`city_price_history` table** — Quarterly avg transaction prices by city + room count (3/4/5), 2020-2025, with national comparison. ~1,625 rows from `market_data.csv`.
2. **`neighborhood_price_history` table** — Quarterly prices by neighborhood + room count, with yield and YoY. ~52,398 rows from `neighborhood_data.csv`.
3. **`import-cbs-data` edge function** — Admin-only bulk importer, accepts parsed CSV rows, upserts in batches of 500.
4. **Admin import page** — `/admin/import-cbs-data` with file upload for both CSVs.
5. **Public read-only RLS** — Both tables have SELECT-only policies (public government data).

### Next steps (not yet built):
- City page trend charts using `city_price_history`
- Neighborhood comparison widgets using `neighborhood_price_history`
- AI market insights grounded in neighborhood-level data

## Phase 3: GovMap Transaction Import — Implemented ✅

1. **DB Migration** — Added `deal_id` column with unique partial index to `sold_transactions`.
2. **`import-govmap-data` edge function** — Admin-only, receives cleaned transaction batches, upserts with `ON CONFLICT (address, city, sold_date, sold_price)`, sub-batches of 100.
3. **Admin page `/admin/import-govmap`** — CSV upload with client-side cleaning pipeline:
   - Filters: non-residential, new construction, price <₪100k, size outliers, unknown cities, duplicate dealIds
   - Hebrew floor parsing, property type normalization, city cross-reference against `cities` table
   - Batch upload (500/batch) with real-time progress
   - Geocoding trigger using existing `geocode-sold-transaction` function
4. **Known Tax Authority flaws handled** — year_built=1900→null, floor=0→null when size=0

## Phase 4: Agency Import Pipeline Hardening — Implemented ✅

Based on Perplexity blueprint research. All changes in `import-agency-listings/index.ts`.

1. **Hebrew Dictionary in AI Prompt** — Comprehensive dictionary embedded in extraction prompt:
   - 15+ property types (דירת סטודיו, לופט, דירת גג, טריפלקס, etc.)
   - 17+ amenities (ממ"ד, מחסן, מרפסת שמש, סוכה, דוד שמש, בויידם, etc.)
   - Condition terms (משופץ→renovated, שמור→good, דורש שיפוץ→needs_renovation)
   - Hebrew floor ordinals (קרקע→0, ראשונה→1 ... עשירית→10, מרתף→-1)
2. **Resale-Only Filtering** — Extended `isNonResalePage()`:
   - Pre-LLM: rental indicators (להשכרה, שכירות), new dev indicators (מקבלן, על הנייר, פרויקט חדש)
   - Post-extraction: skip for_rent, price<20K (rent), price=1 (sold placeholder), land/commercial
3. **City-Specific Price & Size Validation** — `CITY_PRICE_RANGES` for all 25 cities, `ROOM_SIZE_RANGES` for 1-6+ rooms. Produces warnings (not hard failures) stored in `validation_warnings`.
4. **Confidence Scoring (0-100)** — Weighted scoring across 8 fields (price 20%, rooms 15%, size 15%, city 15%, address 10%, property type 10%, photos 10%, description 5%). Thresholds: <40 skip, 40-79 import+flag, 80+ import.
5. **Enhanced Address Dedup** — `normalizeAddressForDedup()` strips "רחוב" prefix, normalizes Hebrew final-form chars (כ↔ך, פ↔ף, etc.), removes hyphens. Tier 2 fuzzy dedup now uses ±5 sqm tolerance.
6. **Placeholder Image Detection** — Skips images <5KB, detects repeated URLs across batch (3+ = placeholder), filters "no-image"/"placeholder" URLs.
7. **DB Migration** — Added `confidence_score` integer column to `import_job_items`.

### Deferred to Phase 2:
- Apify Yad2 adapter (needs account + API key)
- WordPress/CMS structured data detection
- Image pHash deduplication
- Cross-source dedup (Tier 3)
- Review UI with side-by-side comparison
- Incremental sync
- Rental module

## Phase 5: Agency Import Pipeline Phase 2 — Implemented ✅

1. **Review UI** — New `/agency/import/:jobId/review` page with side-by-side source vs parsed data view. Components: `AgencyImportReview.tsx`, `ImportReviewCard.tsx`. Editable fields, confidence score badges, bulk approve (80+), filter tabs.
2. **Rental Support** — `import_type` column on `import_jobs` (`resale`|`rental`|`all`). Pre-LLM filter and validation now respect import type. UI selector for import type before discovery.
3. **CMS/Structured Data Detection** — `extractStructuredData(html)` parses JSON-LD (`RealEstateListing`, `Product`, `Offer`) and Open Graph tags from HTML. Merged with AI extraction, +10 confidence boost when structured data confirms fields. Firecrawl now requests `html` format.
4. **Incremental Sync** — `sync-agency-listings` edge function for daily cron. Agencies table extended with `auto_sync_url`, `auto_sync_enabled`, `last_sync_at`. Auto-sync toggle in import UI.
5. **Approve Item Action** — `handleApproveItem` in edge function for manual review approval with image download and geocoding.
6. **DB Migration** — Added `import_type`, `is_incremental` to `import_jobs`; `auto_sync_url`, `auto_sync_enabled`, `last_sync_at` to `agencies`.

### Deferred to Phase 3:
- Apify Yad2 adapter (needs account + API key)
- Image pHash deduplication
- Cross-source dedup (Tier 3)
