
# Co-Listing v2 — Yes, this covers everything

## I understand the shift

**Old model**: One agency owns each property. Second agency = blocked duplicate. Wrong for Israel — listings are non-exclusive, most apartments have 2-4 agencies, and your scraper was silently dropping multi-unit towers.

**New model**: Every property has **one PRIMARY agency** (front-and-center, owns contact card, counts toward tier) plus **zero or more SECONDARY co-listing agencies** (visible "also listed by", can receive their own leads, don't count against tier limits). First-to-list wins primary by default; manual beats scrape; featured boost = temporary primary swap; admin disputes resolve edge cases.

## Plan coverage check — yes, complete

I cross-referenced the migration file (1,859 lines, 8 phases) against the explainer doc and the existing frontend. **Every behavior the doc promises is backed by code that exists or migrations that will create it.** Nothing missing.

### Frontend already built (just needs DB to function)
- `src/pages/admin/AdminPrimaryDisputes.tsx` ✓
- `src/pages/admin/AdminPrimaryHistory.tsx` ✓
- `src/pages/admin/AdminColistingReports.tsx` ✓
- `src/pages/admin/AdminColistingTelemetry.tsx` ✓
- `src/pages/admin/AdminMergeReversals.tsx` ✓
- `src/hooks/useAdminColisting.ts` ✓
- `src/hooks/useDuplicateCheck.ts` ✓ (calls all 4 wizard RPCs)
- `src/hooks/useFeaturedListings.ts` ✓ (calls boost RPCs)
- `src/components/property/CoListingAgents.tsx` ✓ (buyer "also listed by")

### What's missing — the database

## Implementation phases

Each DB phase = one approval-gated migration. They map 1:1 to the migration file.

**Phase 1 — Foundation** (lines 11-327)
`primary_agency_id` column + sync trigger, boost columns, `primary_agency_history` + RLS + legacy seed, `primary_disputes` + RLS, `merge_events` + RLS, `property_co_agents` RLS policies, `log_primary_transition()` helper.

**Phase 2 — Scraper schema** (lines 333-455)
Widen `import_job_items.status` to allow `'co_listed'`, add stale-scrape index, ship `colisting_stale_sweep()` (60-day demotion with 7-day cooldown).

**Phase 3 — Wizard RPCs** (lines 460-729)
`check_intra_agency_duplicate`, `colist_as_secondary`, `upgrade_primary_from_scrape` (with 20/day rate limit), `file_primary_dispute_with_colist`. **After this lands, `useDuplicateCheck.ts` works end-to-end and the wizard TS errors disappear.**

**Phase 4 — Admin RPCs** (lines 738-899)
`resolve_primary_dispute`, `admin_override_primary`. Unblocks the disputes admin page.

**Phase 5 — Boost mechanic** (lines 907-1180)
`start_primary_boost`, `end_primary_boost`, `colisting_boost_expiry_sweep`, `get_agency_primary_listing_count` (tier-counting source of truth).

**Phase 6 — Notifications** (lines 1188-1548)
Triggers on `primary_agency_history` insert and `primary_disputes` insert/update; `colisting_boost_warning_sweep`; replace `end_primary_boost` with notification-emitting version.

**Phase 7 — Buyer reports** (lines 1556-1675)
`colisting_reports` table + RLS + `file_colisting_report` RPC.

**Phase 8 — Telemetry + archive** (lines 1683-1859)
`get_colisting_telemetry()` (single-shot JSON for admin dashboard), `block_cross_agency_conflicts_insert` trigger to lock down legacy table.

**Phase 9 — Cron + frontend cleanup**
- Schedule via `pg_cron` (using `cron.schedule` + `net.http_post`, inserted via insert tool since it contains the project URL):
  - `colisting_stale_sweep()` — daily 02:30 UTC
  - `colisting_boost_expiry_sweep()` — every 15 min
  - `colisting_boost_warning_sweep()` — daily 09:00 UTC
- Fix residual TS errors in `useAgency.tsx` and `useAgencyListings.tsx` (cast listing_status string[] to enum array; `as unknown as` casts where Supabase types lag schema).

**Phase 10 — End-to-end QA**
Manual scenarios I'll walk through with you:
1. Scrape-only match → wizard shows 3-button confirm → "claim" runs `upgrade_primary_from_scrape` → history row + notification fire
2. Manual match → wizard shows 4-button confirm → "co-represent" attaches as secondary
3. Dispute path → file_primary_dispute_with_colist → both agencies notified, admin sees in `/admin/primary-disputes`, uphold → primary swaps + notifications
4. Featured boost on a co-listed where you're secondary → primary swap → 30 days later sweep restores
5. Buyer "Not the same apartment?" → report appears in `/admin/colisting-reports`
6. `/admin/colisting-telemetry` → JSON renders all sections
7. Tier counter excludes co-listed secondaries

## Notes / adjustments
- All migrations are `IF NOT EXISTS`/`OR REPLACE` → re-runnable.
- `cross_agency_conflicts` reads stay open (legacy v1 admin page keeps working as read-only history) — only inserts blocked.
- Seller-verification, photo unit-detection, un-merge button, and email-channel notifications are **deliberately out of scope** per the explainer (v1 limits).
- Cron jobs must use the insert tool (not migrations) because they embed the project URL + anon key — per Lovable guidance.
