## Goal

Update agency provisioning so an admin can add up to three source links at once for each agency:

- Agency website
- Yad2 agency/profile/search page
- Madlan office/search page

Then run discovery/import across all provided sources and merge the results into the best single listing records.

## Current state

Already built:

- `agency_sources` table for multiple sources per agency.
- `/agency/sources` page where agencies can add sources and sync them.
- `sync-agency-listings` function that processes all active sources per agency.
- Cross-source merge logic in `import-agency-listings`.
- No Yad2/Madlan image downloading.
- Agency website image downloading.

Needs adjustment:

- Admin provisioning currently only accepts one source URL at a time.
- Existing copy and backend trust comments still describe `Yad2 → Madlan → Website`.
- Backend field priority should be changed so the agency website is the preferred source for owned content and visuals, while Yad2/Madlan are enrichment/validation sources.

## UX plan

### 1. Replace the single-source selector in Admin Agency Provisioning

In the “Import listings” card, replace the Website/Yad2/Madlan tabs and single URL field with three optional fields:

```text
Step 1: Add listing sources

Agency website URL     [ https://agency-site.com/listings       ]
Yad2 URL               [ https://www.yad2.co.il/...             ]
Madlan URL             [ https://www.madlan.co.il/...           ]

[ Save sources + discover listings ]
```

Rules:

- At least one URL is required.
- Empty fields are skipped.
- Existing saved sources for that agency should prefill when available.
- If a source already exists, update it instead of creating duplicates.
- Show small helper text:
  - “Agency website is preferred for photos and owned listing content.”
  - “Yad2 and Madlan are used for enrichment, matching, and conflict checks.”

### 2. Show source health/status in provisioning

Below the three URL fields, show a compact list of saved sources:

- Source type
- Active/paused status
- Last synced
- Last failure reason if any
- “Sync this source” action

This reuses the existing `useAgencySources` hooks where possible.

### 3. Add one admin action to run all sources

Add a primary action:

```text
Discover from all active sources
```

This should process all saved sources for the selected agency, in the intended order:

1. Agency website
2. Madlan
3. Yad2

The button should trigger the existing multi-source sync path or a small helper that invokes discovery for each saved source.

## Backend/import plan

### 4. Update source priority semantics

Change the effective merge priority from:

```text
Yad2 → Madlan → Website
```

to:

```text
Agency Website → Madlan/Yad2 enrichment
```

Practical field rules:

- Agency website wins for:
  - images
  - description when credible/long enough
  - agent assignment if detected from agency site
  - source URL shown as “View original” when website has usable photos/content
- Yad2/Madlan can fill missing or weak fields:
  - price
  - size
  - rooms/bedrooms
  - floor
  - address/neighborhood
  - coordinates
  - amenities/features
- If agency website has a field and Yad2/Madlan disagree materially, do not blindly overwrite. Log a conflict for review.
- Keep conflict logging for large price/size differences.

### 5. Preserve image compliance

Keep the existing safety rule:

- Do not extract/download/store Yad2 or Madlan photos.
- Only download/store images from the agency’s own website.

Also update the code comments and UI copy so this is clear.

### 6. Align scheduled sync order

Update `sync-agency-listings` so agency sources process in the new order:

```text
website → madlan → yad2
```

This helps the website listing become the base record first, then portal sources enrich/merge into it.

### 7. Keep existing merge infrastructure

Continue using:

- `merged_source_urls`
- `field_source_map`
- `import_conflicts`
- cross-source duplicate checks by address/city and fuzzy property specs
- import job progress UI

No database schema change is expected unless we discover the current uniqueness/indexing on `agency_sources` is missing and causes duplicate source rows. If schema work is required, it will be handled as a separate migration.

## Files likely to change

- `src/components/admin/agency-provisioning/ImportListingsSection.tsx`
  - new three-field source UI
  - save/update multiple sources
  - run multi-source discovery

- `src/hooks/useAgencySources.ts`
  - add or reuse helper for upserting multiple agency sources
  - possibly add admin-friendly “sync all for agency” helper

- `supabase/functions/sync-agency-listings/index.ts`
  - update source processing order to website-first
  - update comments/copy

- `supabase/functions/import-agency-listings/index.ts`
  - update merge source trust rules
  - keep Yad2/Madlan image skipping
  - make agency website owned content the preferred source

- Possibly `src/pages/agency/AgencySources.tsx` and `src/pages/agency/AgencyImport.tsx`
  - update explanatory copy so all pages describe the same strategy

## QA plan

After implementation:

1. Run TypeScript/build checks.
2. Check the admin provisioning screen visually.
3. Confirm the three source fields save and prefill correctly.
4. Confirm “Discover from all active sources” queues/runs all non-empty sources.
5. Confirm Yad2/Madlan import paths do not store images.
6. Confirm agency website imports still store images.
7. Confirm merge text/status shows all source URLs and conflicts where relevant.

## Expected result

Admin provisioning becomes a single multi-source setup step: paste any combination of website/Yad2/Madlan links once, then the system imports and merges them into richer listings while prioritizing agency-owned content and photos.