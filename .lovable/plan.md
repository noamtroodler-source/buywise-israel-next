

## Cache Domain City Inference at Batch Level

### Problem
Inside `processOneItem` (line 1110), `inferCityFromDomain(item.url)` is called for every item that has no city after AI extraction. For a single-city agency site like `jerusalem-real-estate.co`, this runs the same hostname parsing and keyword scan 100+ times with the identical result. While cheap individually (~microseconds), it adds up and is conceptually wasteful -- the domain never changes within a job.

### Solution
Compute the domain-to-city inference once in `handleProcessBatch` before the refill loop starts, then pass the cached result into `processOneItem` so it can use it directly instead of recalculating.

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

**1. Compute cached city in `handleProcessBatch`**

After fetching the job (line 1369), use the job's `website_url` to infer the city once:

```text
const cachedDomainCity = inferCityFromDomain(job.website_url);
if (cachedDomainCity) {
  console.log(`Domain city cached for job: ${cachedDomainCity} (from ${job.website_url})`);
}
```

**2. Add parameter to `processOneItem`**

Add a new `domainCity: string | null` parameter to the function signature (after `jobId`).

**3. Use cached value in `processOneItem`**

Replace lines 1109-1114:
```text
// BEFORE:
if (!listing.city || listing.city.trim() === "") {
  const domainCity = inferCityFromDomain(item.url);
  if (domainCity) {
    console.log(`City inferred from domain for ${item.url}: ${domainCity}`);
    listing.city = domainCity;
  }
}

// AFTER:
if (!listing.city || listing.city.trim() === "") {
  if (domainCity) {
    listing.city = domainCity;
  }
}
```

**4. Update the call site**

In the refill loop (line 1447), pass the cached value:
```text
chunk.map(item => processOneItem(item, sb, job, agentId, FIRECRAWL_API_KEY, LOVABLE_API_KEY, job_id, cachedDomainCity))
```

### Edge Cases

| Concern | How it's handled |
|---|---|
| Job URL has no city hint | `cachedDomainCity` is `null`, same fallback behavior as before (city stays empty) |
| Items from different domains than the job | Not possible -- all items in a job come from the same `website_url` domain |
| `inferCityFromDomain` logic changes later | Only one call site to update (in `handleProcessBatch`), simpler maintenance |
| Existing behavior preserved | Identical logic, just moved from per-item to per-batch. No functional change. |

### Impact
- Eliminates N redundant `URL` constructor + string scan calls per batch (N = number of items without a city)
- Cleaner code -- makes the "once per domain" intent explicit
- Zero risk -- pure refactor with no behavioral change

### Technical Summary
1. Add `const cachedDomainCity = inferCityFromDomain(job.website_url)` in `handleProcessBatch` before the loop
2. Add `domainCity: string | null` parameter to `processOneItem`
3. Replace inline `inferCityFromDomain(item.url)` call with the passed-in `domainCity` value
4. Update the `processOneItem` call site to pass `cachedDomainCity`

