# Sample audit for JRE listings

Build a one-shot QA tool that audits **5 random JRE listings** against the live agency site and reports problems — no manual checking.

## What it checks per listing

For each of 5 random JRE properties (or N you pick), re-fetch the live `source_url` via Firecrawl and compare against what's stored:

1. **Photos**
   - Count: stored vs live
   - Foreign photos: any image whose nearest `<a href>` slug ≠ this listing's slug (catches "similar properties" leaks)
   - Cross-listing duplicates: phash hamming ≤5 against other JRE listings (uses existing `image_hashes` table)
   - Missing photos: on live page but not stored

2. **Listing type** (Gemini classifier on title + description + URL)
   - Allowed: `resale`, `long_term_rental`
   - Flagged: `short_term_rental`, `new_project`, `other` → marked for unpublish

3. **Features**
   - Re-run strict extractor on live description
   - Diff vs stored `features[]`
   - Report `missing_features[]` (under-extracted) and `extra_features[]` (potential fabrication)

4. **Field accuracy**
   - Gemini extracts price, bedrooms, size, neighborhood, address from live page
   - Diff vs stored — flag mismatches beyond tolerance (e.g. price > 2% off, bedrooms differ)

5. **Cross-contamination**
   - Check if this listing's title/address appears inside another JRE listing's description (catches swapped content)

## Output

A single JSON report returned by the function and rendered in a new admin panel card at `/admin/agency-provisioning`:

```text
Audit: 5 JRE listings  •  Run at 14 May 2026
─────────────────────────────────────────────
✓ 2 OK
⚠ 2 warnings
✗ 1 critical

[expand] 12 Rechov Example — CRITICAL
  • Type: short_term_rental (should be unpublished)
  • Photos: 18 stored / 9 on live page (9 foreign, slugs mismatch)
  • Extra features: sukkah_balcony, underfloor_heating (not in description)
  • Price mismatch: stored ₪4.2M / live ₪3.8M
  [View live] [View stored] [Unpublish]
```

Photo issues show side-by-side thumbnail strips (live vs stored) so you can eyeball it in 5 seconds.

## Where it lives

- New edge function: `audit-agency-listings` (POST `{ agency_id, sample_size: 5 }`)
- New panel: `AgencyAuditPanel` added to `AdminAgencyProvisioning` page
- One button: **"Run sample audit (5 listings)"** + a results table below
- No DB table yet — results returned in-memory, displayed transiently. (Can add `listing_audit_reports` table later if you want history.)

## Out of scope (for this pass)

- No auto-fixes, no auto-unpublish — flags only
- No cron, no full-agency runs — just on-demand sample
- No new agencies — JRE only; agency_id is parameterized so Erez/others work too with the same button later

## Technical details

- **Function:** `supabase/functions/audit-agency-listings/index.ts`. Uses Firecrawl scrape (markdown + html), Lovable AI Gateway (`google/gemini-2.5-flash`), service-role Supabase client.
- **Sampling:** `SELECT id, source_url, ... FROM properties WHERE primary_agency_id = $1 AND source_url IS NOT NULL ORDER BY random() LIMIT 5`
- **Photo slug check:** parse stored image URLs, extract listing slug from `source_url`, flag any image whose URL path or surrounding anchor doesn't reference that slug
- **Phash dup check:** join `image_hashes` for all JRE properties, compute hamming distance using existing helper from `ImageDedupPanel.tsx`
- **Type classifier:** single Gemini call, JSON output `{ type: enum, confidence: number, reasoning: string }`
- **Feature diff:** reuses the same prompt as `refresh-listing-features`
- **Field extraction:** one Gemini call returning `{ price_nis, bedrooms, size_sqm, neighborhood, address }` from live HTML
- **Tolerance:** price ±2%, size ±5%, bedrooms exact, address fuzzy match
- **Runtime:** ~5 listings × (1 Firecrawl + 3 Gemini) ≈ 30–60s, well within edge function limits
- **UI:** new file `src/components/admin/AgencyAuditPanel.tsx`, mounted in `src/pages/admin/AdminAgencyProvisioning.tsx`
