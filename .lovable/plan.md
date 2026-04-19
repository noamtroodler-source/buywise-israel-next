

The user wants a phased rollout plan to conquer all the gaps in the multi-source import/merge pipeline (Yad2 + Madlan + Website) — built incrementally with testing checkpoints between each phase.

Recapping the gaps identified:
1. No source-priority enforcement (stale website can overwrite fresh Yad2)
2. No conflict/diff visibility for agencies
3. Auto-sync only handles one URL per agency (`auto_sync_url`) instead of the full `agency_sources` table
4. No "merged vs new" stats in import results
5. No source-health badges
6. `merge_properties()` works but isn't surfaced in agency UI
7. No automated daily duplicate scan (already noted in `.lovable/plan.md`)

I'll structure this as 4 phases — each is independently shippable and testable. Phases ordered by impact (data integrity first, then visibility, then automation, then polish).

---

# Multi-Source Import Pipeline — Phased Rollout

## Phase 1 — Data Integrity (Foundation)
**Goal:** Stop bad data from overwriting good data. Fix the merge brain before adding anything else.

**Build:**
- Add `source_trust_rank` logic to the import-agency-listings function: enforce **Yad2 > Madlan > Website** for structured fields (price, size, rooms, address, coordinates)
- Lower-trust sources can only **gap-fill** empty fields, never overwrite
- For descriptions/features: keep "richer wins" (longer description, larger feature union)
- Add a `price_conflict` log entry when sources disagree by >10% (new table: `import_conflicts`)
- Track which source contributed which field via `field_source_map` JSONB on `properties`

**Test checklist:**
- Import same listing from Yad2 → then Website with stale price → confirm Yad2 price wins
- Import from Madlan → then Yad2 → confirm Yad2 overwrites Madlan price
- Import from Website only → then Yad2 → confirm Yad2 enriches without losing Website description
- Verify `import_conflicts` rows appear on >10% mismatches

---

## Phase 2 — Visibility (Agency Trust)
**Goal:** Make the merge logic transparent so agencies trust the system.

**Build:**
- Update `AgencyImport.tsx` results card: show **"X new, Y enriched, Z merged across sources"** instead of just "succeeded"
- New component `MergedSourcesPanel` on each property card in `AgencyListings.tsx`: small badges showing all source origins (Yad2 / Madlan / Website) with last-checked timestamp
- New page `/agency/conflicts` listing all `import_conflicts` for the agency — agency can manually resolve which source wins
- Add a "Source Trust" tooltip in the import wizard explaining the priority order

**Test checklist:**
- Run a multi-source import → verify the result card shows accurate enrich/merge counts
- Open a property with 3 sources → confirm all 3 badges appear
- Trigger a price conflict → confirm it appears on `/agency/conflicts` and can be resolved

---

## Phase 3 — Multi-Source Auto-Sync (Automation)
**Goal:** Wire the existing `agency_sources` table fully into the nightly cron so all sources sync, not just one.

**Build:**
- Refactor `sync-agency-listings` edge function to iterate `agency_sources` (active=true, ordered by priority Yad2→Madlan→Website) instead of the legacy single `auto_sync_url`
- Add **sequential processing** per agency (Yad2 first, then Madlan, then Website) to give the merge logic clean trust ordering
- Update `consecutive_failures` and `last_failure_reason` in `agency_sources` after each run
- Add `daily-duplicate-scan` cron job calling `detect-duplicates` at 6 AM (per `.lovable/plan.md`)
- Auto-merge for very-high-confidence pairs (score ≥90, same bedrooms, price within 3%)

**Test checklist:**
- Add Yad2 + Madlan + Website sources for City Zen agency → trigger nightly sync manually
- Confirm sources run in priority order with proper merging
- Verify failure tracking increments correctly when a URL 404s
- Verify cron logs show daily duplicate scan running

---

## Phase 4 — Polish & Source Health (UX)
**Goal:** Make agency self-service for source management.

**Build:**
- Update `/agency/sources` (or create) management page: list all sources with health badges (✅ Healthy / ⚠️ Failing / ❌ Broken based on `consecutive_failures`)
- Add per-source "Test Now" and "Pause" buttons
- Show "Last successful sync: 2h ago" per source
- Email/notification to agency admin when a source fails 3x in a row
- Onboarding tooltip in `ImportWelcomeBanner`: "Add Yad2 first (highest trust), then Madlan, then your website — we'll merge automatically"

**Test checklist:**
- Verify health badges flip when a source fails repeatedly
- Test pause/resume per source
- Trigger 3 consecutive failures → confirm admin receives notification

---

## Technical File Map

| Phase | Files |
|---|---|
| 1 | `supabase/functions/import-agency-listings/index.ts`, migration: `import_conflicts` table + `field_source_map` column |
| 2 | `src/pages/agency/AgencyImport.tsx`, `src/pages/agency/AgencyListings.tsx`, new `src/components/agency/MergedSourcesPanel.tsx`, new `src/pages/agency/AgencyConflicts.tsx` |
| 3 | `supabase/functions/sync-agency-listings/index.ts`, `supabase/functions/detect-duplicates/index.ts` (auto-merge), pg_cron insert for daily scan |
| 4 | `src/pages/agency/AgencySources.tsx`, `src/components/agency/SourceHealthBadge.tsx`, `supabase/functions/notify-source-failure/index.ts` |

## Recommendation
Ship **Phase 1 + Phase 2 together** as the first release (data integrity + visibility = the trust foundation). Then Phase 3 a few days later once we've watched real merge behavior in production. Phase 4 last, since it's pure polish.

Approve and I'll start with Phase 1.

