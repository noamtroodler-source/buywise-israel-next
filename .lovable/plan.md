
# Make Madlan Scraping Bulletproof

Cityzen has 50 active listings on Madlan (45 sale + 5 rent), but our Apify actor returns 0 across every city/dealType combination. This plan layers three independent fallbacks so a single point of failure can never zero us out again — and applies to **every** agency, not just Cityzen.

## What we're solving

The current adapter only knows one input shape: `{ city, dealType, officeUrl }`. If any of these fail (actor doesn't recognize officeUrl param, city is too small, agency name doesn't match), we get 0 — even when the office page itself clearly lists 50 properties. We also have no visibility into **why** Apify returned 0.

## The 3-tier strategy

```text
Tier 1 — Apify per city (current)
   {city, dealType, officeUrl}  ──► 0?  next
Tier 2 — Apify direct office URL (NEW)
   {startUrls: [officeUrl]}      ──► 0?  next
Tier 3 — Firecrawl the office page (NEW)
   GET madlan.co.il/agentsOffice/{id} → extract /listing/ URLs → AI-extract each
```

Tier 3 is the safety net: it does not depend on the Apify actor knowing anything about office IDs. As long as the office page renders in a browser, we will find listings.

## Implementation steps

### 1. Add diagnostic logging to current Apify calls
Before changing logic, instrument what we already have so future failures are debuggable:
- Log the **exact actor input payload** sent
- Log the **raw response item count** before any filtering
- Log the **count after** `isMadlanItemLiveAndAgencyScoped` filter (so we can see if the actor returned items but our filter rejected them all)
- Persist Apify `runId` to `import_jobs.failure_reason` JSON

### 2. Fix agency-name matching (`isMadlanItemLiveAndAgencyScoped`)
Current code splits agency name on whitespace and matches first token only. This breaks for:
- Hebrew variants (`Cityzen` vs `סיטיזן`)
- Casing/whitespace drift
- Single-word agency names with punctuation

Normalize both sides: lowercase, strip non-alphanumeric (Latin + Hebrew), then check if either contains the other. Add the agency's `name_he` field to the comparison if present.

### 3. Add Tier 2 — Apify `startUrls` mode
Add a third attempt to the existing `attempts` array:
```ts
{ startUrls: [{ url: websiteUrl }], maxItems: 60, _label: "office-url-direct" }
```
Run this once per dealType (not per city) — the office URL already scopes the broker.

### 4. Add Tier 3 — Firecrawl office-page fallback
If Tiers 1 & 2 both return 0 across all cities, scrape the office page itself with Firecrawl (already configured in this function):
- `firecrawlScrape(officeUrl, { formats: ['html', 'links'], waitFor: 3000 })`
- Extract URLs matching `/listing/{id}` or `/nadlan/(for-sale|for-rent)/` from the rendered HTML
- Push those URLs into the existing per-listing extraction pipeline (same path the website source uses)

### 5. Per-attempt failure reasons
Update `last_failure_reason` to record which tier(s) ran and what each returned, e.g.:
```json
{
  "tier1_per_city": {"discovered": 0, "tried_cities": 5},
  "tier2_office_url": {"discovered": 0, "runId": "abc..."},
  "tier3_firecrawl": {"discovered": 50, "extracted": 47}
}
```

### 6. Re-trigger Cityzen and validate
Once deployed, re-run the Cityzen Madlan source. Expected outcome: Tier 3 catches all 50 listings even if Tiers 1 & 2 still return 0. From there, feed them through the standard merge pipeline so they dedupe against Yad2/website results.

## Files to change
- `supabase/functions/import-agency-listings/index.ts`
  - `runMadlanAgencyDiscoverJob` — add Tier 2 + Tier 3 + diagnostics
  - `isMadlanItemLiveAndAgencyScoped` — normalize agency-name matching

## Why this is the right call
- **No new dependencies** — Apify and Firecrawl are both already wired in
- **Fails open, not closed** — three independent code paths; only one needs to work
- **Debuggable forever** — diagnostics tell us exactly which tier worked or failed
- **Universal fix** — every future agency on Madlan benefits, not just Cityzen
- **Memory update** — will save `mem://architecture/madlan-3-tier-discovery` so this approach persists

## What we are NOT doing
- Not switching scraper providers (Apify still works for most agencies)
- Not deactivating the Cityzen Madlan source (we want it to work)
- Not changing the website or Yad2 paths — this is Madlan-only
