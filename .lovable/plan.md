
# Boost ROI Analytics — Wire Real Data

## Root Cause Analysis

The `BoostAnalyticsPanel` renders correctly but the underlying `useBoostAnalytics` hook has **three data bugs** that cause all metric counts to show 0 even when boosts exist. The panel structure and UI are fine — only the hook needs fixing.

### Bug 1 — `project_views` wrong timestamp column (critical)

The hook queries `project_views` using `.gte('viewed_at', ...)` but the `project_views` table has **no `viewed_at` column** — it uses `created_at`. This means every project boost's view count silently returns 0. Property boosts are fine (`property_views` correctly has `viewed_at`).

**Fix:** Change `viewed_at` → `created_at` in the `project_views` count query.

### Bug 2 — Entity-level boosts fall through without metrics (silent gap)

Four products (`agency_directory_featured`, `developer_directory_featured`, `email_digest_sponsored`, `budget_tool_sponsor`) use `target_type = 'agency'` or `target_type = 'developer'` — not `'property'` or `'project'`. The hook's if/else only handles `'property'` and `'project'`, so entity-level boosts always show 0 views, 0 saves, 0 inquiries.

Entity-level boosts don't have per-listing metrics (no view table to query), but they can show **inquiries generated during the boost window** — using `property_inquiries` (for agency) or `project_inquiries` (for developer) filtered by entity ownership and date range.

**Fix:** Add a third branch for entity-level boosts that counts total entity inquiries during the boost window (as a proxy for "leads while boosted"). Views and saves stay 0 for entity-level since the product boosts the entity profile/directory slot, not a specific listing.

### Bug 3 — `totalCreditsSpent` counts `credit_cost` per boost, but entity-level boosts aren't deducted per-listing

This is actually correct — `credit_cost` from `visibility_products` is the right denominator. No change needed here.

### Bug 4 — `avgViewsPerBoost` denominator includes entity-level boosts (which have 0 views)

Because entity-level boosts always have `viewsDuringBoost = 0`, including them in the average dilutes the metric for listing-level boosts. The average should be computed only over boosts that *can* have views (i.e., `target_type === 'property'` or `target_type === 'project'`).

**Fix:** Filter to only listing-level boosts when computing `avgViewsPerBoost`.

---

## What's Already Working (Do Not Change)

- `BoostAnalyticsPanel.tsx` — UI, layout, skeleton states, empty state, chart, and table all render correctly. ✅
- `active_boosts` RLS — entity owners can SELECT their own boosts. ✅  
- `visibility_products` join — `*, visibility_products(name, slug, credit_cost)` works correctly. ✅
- `property_views` query — uses `viewed_at` which is the correct column. ✅
- `favorites` / `project_favorites` queries — both use `created_at`, correct. ✅
- `monthlySpend` chart logic — correct. ✅
- `activeBoostCount` / `completedBoostCount` — correct. ✅

---

## Implementation

### One file to change: `src/hooks/useBoostAnalytics.ts`

**Change A — Fix `project_views` column (line ~136)**

```typescript
// BEFORE (bug):
supabase.from('project_views')
  .select('id', { count: 'exact', head: true })
  .eq('project_id', boost.target_id)
  .gte('viewed_at', boost.starts_at)   // ← wrong column
  .lte('viewed_at', boost.ends_at)

// AFTER:
supabase.from('project_views')
  .select('id', { count: 'exact', head: true })
  .eq('project_id', boost.target_id)
  .gte('created_at', boost.starts_at)  // ← correct column
  .lte('created_at', boost.ends_at)
```

**Change B — Add entity-level boost branch (after the project block)**

For boosts where `target_type` is `'agency'` or `'developer'`, count inquiries that came in during the boost window as a proxy ROI signal:

```typescript
} else if (boost.target_type === 'agency') {
  // Count property inquiries for this agency during boost window
  const { count } = await supabase
    .from('property_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('agency_id', entityId)
    .gte('created_at', boost.starts_at)
    .lte('created_at', boost.ends_at);
  inquiriesDuringBoost = count || 0;
} else if (boost.target_type === 'developer') {
  // Count project inquiries for this developer during boost window
  const { count } = await supabase
    .from('project_inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('developer_id', entityId)
    .gte('created_at', boost.starts_at)
    .lte('created_at', boost.ends_at);
  inquiriesDuringBoost = count || 0;
}
```

**Change C — Fix `avgViewsPerBoost` denominator**

```typescript
// BEFORE:
const avgViewsPerBoost = boostDetails.length > 0
  ? Math.round(totalViews / boostDetails.length)
  : 0;

// AFTER — only count listing-level boosts in denominator:
const listingBoosts = boostDetails.filter(
  b => b.targetType === 'property' || b.targetType === 'project'
);
const avgViewsPerBoost = listingBoosts.length > 0
  ? Math.round(totalViews / listingBoosts.length)
  : 0;
```

---

## Files Summary

| File | Type | Change |
|---|---|---|
| `src/hooks/useBoostAnalytics.ts` | Edit | Fix `project_views` column (`viewed_at` → `created_at`); add entity-level boost branch for agency/developer inquiries; fix `avgViewsPerBoost` denominator |

No DB migration needed. No schema changes. No new hooks. No UI changes.

---

## Technical Notes

- **No test data in `active_boosts`** right now — the panel will still show the "No boosts yet" empty state until a real boost is activated. The fixes ensure data is accurate *when* boosts exist.
- **Entity-level inquiry counts** are the best available proxy for directory/email boost ROI. There's no per-impression tracking for directory slots or email digest placements, so "inquiries during boost window" is the same heuristic used in `AgencyPerformanceInsights`.
- **`property_inquiries.agency_id`** is populated by the `set_inquiry_agency_id` trigger on insert — confirmed in the DB triggers. Safe to filter by it.
- **`project_inquiries.developer_id`** is a direct FK — confirmed in the table schema. Safe to filter by it.
- The hook already passes `entityId` into scope — no additional parameters needed for the new entity-level branch.
