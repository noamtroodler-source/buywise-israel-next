

# Status Check: 2 of 4 Are Already Built

After reviewing the code:

- **Placeholder image detection** — Already implemented. `isPlaceholderImage()` (line 1056) detects repeated URLs across listings (3+ uses = placeholder) and URL pattern matching ("placeholder", "no-image", "default"). Additionally, `parallelImageDownload()` skips images < 5KB (line 1157-1169) and uses SHA-256 dedup for exact byte-match duplicates.

- **Per-field confidence in review UI** — Already implemented. `FieldConfidenceDot` component renders green/yellow/red dots per field (price, rooms, size, address, etc.) in both the read-only view (line 296) and edit mode (line 267) of `ImportReviewCard.tsx`.

---

## Remaining 2 Features to Build

### 1. GovMap Geocoding Fallback

Add GovMap's free geocoding API as a third tier in the `geocode-address` edge function.

**Current chain**: Google Maps → Nominatim → city-only fallback
**New chain**: Google Maps → GovMap → Nominatim → city-only fallback

**File**: `supabase/functions/geocode-address/index.ts`
- Add `geocodeWithGovMap(query)` function that calls GovMap's public geocoding endpoint (govmap.gov.il API — free, no key needed for basic geocoding)
- Insert it between Google and Nominatim in `tryGeocode()`
- Validate results are within Israel bounds (reuse existing `isWithinIsrael`)
- Return `source: 'govmap'` for transparency

### 2. Import Cost Tracking

Track per-job resource consumption: Firecrawl credits, Apify calls, AI token usage.

**Database migration** — New table:
```sql
CREATE TABLE public.import_job_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE NOT NULL,
  resource_type TEXT NOT NULL, -- 'firecrawl', 'apify', 'ai_tokens'
  quantity INT NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'credits', -- 'credits', 'calls', 'tokens'
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.import_job_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can read import costs"
  ON public.import_job_costs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_import_job_costs_job ON public.import_job_costs(job_id);
```

**Edge function changes** (`supabase/functions/import-agency-listings/index.ts`):
- Add helper `trackCost(sb, jobId, resourceType, quantity, unit)` that inserts into `import_job_costs`
- Call after Firecrawl scrape/map calls (1 credit per call)
- Call after Apify actor runs (1 call per run)
- Call after AI extraction (estimate token count from prompt+response length)

**UI** — Add cost column to the Import Analytics dashboard (`AdminImportAnalytics.tsx`):
- New hook section in `useImportAnalytics.ts` to aggregate costs by resource type
- Add a "Costs" summary card showing total Firecrawl credits, Apify calls, AI tokens
- Add per-job cost column in the recent jobs table

**Files to modify/create**:
- `supabase/functions/geocode-address/index.ts` (add GovMap provider)
- `supabase/functions/import-agency-listings/index.ts` (add cost tracking calls)
- `src/hooks/useImportAnalytics.ts` (add cost queries)
- `src/pages/admin/AdminImportAnalytics.tsx` (add cost display)
- New migration SQL for `import_job_costs` table

