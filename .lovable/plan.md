## Goal

Make the agency-website import pipeline reliably reject listings outside Israel while routing address-less listings to manual review (never auto-publishing, never auto-rejecting them).

## What's already in place

The `import-agency-listings` edge function already implements most of the gate:

- **Layer 1 — URL slug blocklist** at discovery (`NON_ISRAEL_SLUG_TOKENS`, ~25 tokens covering Greece, Cyprus, Dubai, Tbilisi, etc.)
- **Layer 2 — post-extraction country check** in `detectOutsideIsraelListing()`:
  - City matched against `EXTERNAL_LOCATION_KEYS`
  - Coordinate bounds check against Israel bbox (29.45–33.35°N, 34.15–35.95°E)
  - Token scan of address + title + description for foreign hits when no Israeli-city signal is present
  - URL path token scan
  - Structured `country:`/`location:` regex scan of page text

So this is an **extension job, not a build-from-zero**. The 5 real gaps:

## The plan

### 1. Expand foreign-location dictionaries

Add the missing high-value tokens to **both** `NON_ISRAEL_SLUG_TOKENS` (Layer 1) and `EXTERNAL_LOCATION_KEYS` (Layer 2):

- Spain: `marbella`, `malaga`, `costadelsol`, `ibiza`, `mallorca`
- Portugal: `algarve`, `cascais`, `porto`
- France: `cannes`, `nice`, `monaco`, `cap-ferrat`, `cote-d-azur`, `montecarlo`
- Caribbean / LatAm: `costa-rica`, `tulum`, `puntacana`, `panama`
- Asia / other: `bali`, `phuket`, `koh-samui`, `montenegro`, `kotor`, `turkey`, `bodrum`, `istanbul`
- US: `manhattan`, `brooklyn`, `losangeles`, `aspen`
- Also add the Hebrew variants for the top 5 (יוון, קפריסין, דובאי, מיאמי, לונדון)

### 2. Strengthen the structured regex

The `structuredOutsideMatch` regex (line 588) only catches ~12 city/country names. Replace with a generated alternation built from `EXTERNAL_LOCATION_KEYS` so it stays in sync automatically when we extend the dictionary. Also widen the field labels to include `מדינה` / `אזור` (Hebrew "country" / "area") since CityZen-style sites mix Hebrew and English.

### 3. Address-less listings → "Location unclear" review bucket (your call)

Today, a listing with no city + no coordinates + no foreign hits silently passes through and gets inserted. Per your instinct, route these to manual review instead:

- New skip reason: `location_unclear`
- In the AI extraction validator, if all of: `city` empty AND `address` empty AND `latitude`/`longitude` null → **don't insert**, write to `import_job_items` with `status='skipped'`, `error_type='needs_review'`, `error_message='Location unclear — no city/address/coords extracted'`
- Surface in the existing audit panel as a **new dedicated chip** ("Location unclear") next to "Quick review" and "Major review", so it's distinct from quality issues
- Admin can then either delete or manually patch the address from the listing source URL

### 4. Audit-log outside-Israel rejections

Add a small `provisioning_audit` jsonb tag on each skipped item so you can spot-check Gemini isn't being overzealous:

```json
{
  "outside_israel": true,
  "trigger_layer": "city_match | coords_bbox | token_scan | url_slug | structured_regex",
  "matched_token": "marbella"
}
```

Already partially there (`outside_israel_reason` is stored at line 5027) — just standardize it as a structured object so the audit dashboard can group by trigger layer and we can see *why* things are being rejected.

### 5. Show rejection counts in the audit panel

In `Listings & Quality` (the panel from your earlier screenshot), add three small counters under the "5 need major review" line:

- "X skipped — outside Israel"
- "X needs location review"
- Click-through opens a filtered list of `import_job_items` with that skip reason, so you can audit weekly

### Explicitly NOT doing (per your call)

- Phone number country-code heuristic
- EUR/GBP/AED currency-only rejection

USD continues to pass freely (international buyers see prices in USD anyway, and CityZen prices many Israel listings in USD).

## Files touched

- `supabase/functions/import-agency-listings/index.ts` — expand dictionaries, regex, add `location_unclear` skip path, structured audit tag
- `src/components/admin/agency-provisioning/ListingsQualityPanel.tsx` (or equivalent — needs confirming during build) — add the two new counter chips and filter
- Memory update: extend `mem://constraints/non-israel-url-filter` with the new tokens and the `location_unclear` review path

## Open question

For #5 (audit panel counters), do you want a simple read-only counter, or a clickable filter that loads the rejected items inline so you can one-click "force-publish anyway" if Gemini was wrong? The second is more work but gives you an escape hatch when the filter is too aggressive.
