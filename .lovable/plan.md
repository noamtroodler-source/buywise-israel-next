

# Phase 5: Ongoing Governance — Data Freshness & Review Tracking

This phase builds infrastructure so the team knows when data is stale and what needs updating, rather than relying on memory.

---

## Overview

Phase 5 creates three things:
1. A **Data Governance Dashboard** in the admin panel showing staleness per data category
2. A **`data_review_schedule`** database table tracking review cycles and next-due dates
3. **Per-category "last updated" indicators** on public-facing pages

---

## 1. New Database Table: `data_review_schedule`

Tracks review cadence for each data category with next-due dates and responsible source.

```sql
CREATE TABLE public.data_review_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  review_frequency TEXT NOT NULL, -- 'annual', 'quarterly', 'monthly', 'on_change'
  last_reviewed_at TIMESTAMPTZ,
  next_review_due TIMESTAMPTZ,
  source_authority TEXT NOT NULL,
  source_url TEXT,
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.data_review_schedule ENABLE ROW LEVEL SECURITY;
-- Admin-only read/write
CREATE POLICY "Admins manage review schedule" ON public.data_review_schedule
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
-- Public read for freshness indicators
CREATE POLICY "Public can read review schedule" ON public.data_review_schedule
  FOR SELECT TO anon USING (true);
```

Seed with these review items:

| category | label | frequency | source_authority | next_review_due |
|----------|-------|-----------|-----------------|-----------------|
| `tabu_fees` | Tabu & Registration Fees | annual | Ministry of Justice | 2027-01-15 |
| `purchase_tax` | Purchase Tax Brackets | annual | Israel Tax Authority | 2027-01-15 |
| `vat_rate` | VAT Rate | on_change | Knesset / MoF | — |
| `boi_directive_329` | BOI Mortgage Directive 329 | on_change | Bank of Israel | — |
| `cbs_price_stats` | CBS Price Statistics | quarterly | CBS | 2026-06-15 |
| `arnona_rates` | Arnona Municipal Rates | annual | Municipalities | 2027-01-15 |
| `sei_index` | Socioeconomic Index (SEI) | ~biennial | CBS | 2027-06-01 |
| `city_population` | City Population Data | annual | CBS | 2027-01-01 |
| `exchange_rate` | USD/ILS Exchange Rate | monthly | Bank of Israel | 2026-04-15 |
| `mortgage_rates` | Mortgage Interest Rates | quarterly | Bank of Israel | 2026-06-15 |
| `cgt_exemptions` | Capital Gains Exemptions | on_change | Knesset | — |
| `professional_fees` | Professional Fee Ranges | annual | Industry survey | 2027-01-15 |

## 2. Admin Data Governance Dashboard

New page at `/admin/data-governance` with:

- **Staleness overview cards**: Overdue (red), Due soon (amber), Current (green)
- **Table** showing each category, last reviewed, next due, days until due/overdue, source
- **"Mark as reviewed"** button per row that updates `last_reviewed_at` to now and advances `next_review_due` based on frequency
- **Link** to source URL for quick reference

Add navigation link in admin sidebar.

### File: `src/pages/admin/AdminDataGovernance.tsx`

## 3. Public Freshness Indicators

### 3a. `useDataFreshness` hook
New hook that queries `data_review_schedule` (cached 1hr) and exposes a helper: `getCategoryFreshness(category) → { lastReviewed, nextDue, isStale, label }`.

### 3b. `DataFreshnessIndicator` component
Small inline component showing "Data as of Mar 2026" or "⚠ Review overdue" — used in:
- **Calculator tools** (`SourceAttribution.tsx`) — show freshness per tool's data categories
- **City pages** (`CitySourceAttribution.tsx`) — show per-category freshness in the methodology section

### 3c. Update `toolSources.ts`
Add a `reviewCategories` field to each `ToolSourceConfig` mapping tools to `data_review_schedule` categories, so freshness indicators know which categories apply to which calculator.

## 4. Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/admin/AdminDataGovernance.tsx` | **Create** — full governance dashboard |
| `src/hooks/useDataFreshness.ts` | **Create** — hook for freshness queries |
| `src/components/shared/DataFreshnessIndicator.tsx` | **Create** — inline freshness badge |
| `src/lib/calculations/toolSources.ts` | **Modify** — add `reviewCategories` per tool |
| `src/components/tools/shared/SourceAttribution.tsx` | **Modify** — show freshness indicators |
| `src/components/city/CitySourceAttribution.tsx` | **Modify** — show per-category freshness |
| `src/App.tsx` | **Modify** — add route for `/admin/data-governance` |
| `src/pages/admin/AdminLayout.tsx` | **Modify** — add sidebar link |

## Execution Order

1. Create `data_review_schedule` table + seed data
2. Create `useDataFreshness` hook
3. Create `DataFreshnessIndicator` component
4. Create `AdminDataGovernance.tsx` dashboard
5. Update `toolSources.ts` with review category mappings
6. Integrate freshness indicators into `SourceAttribution` and `CitySourceAttribution`
7. Add admin route and sidebar link

