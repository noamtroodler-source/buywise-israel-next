

## Parallelize Batch Processing (3 Concurrent Items)

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

The current `for (const item of pendingItems)` loop (lines 727-1257) processes each item one at a time: scrape, AI extract, validate, duplicate check, download images, geocode, insert. This means 10 items take ~10x the time of one item.

### Architecture

Replace the sequential loop with a controlled concurrency model:

```text
 BEFORE (sequential):                AFTER (parallel, 3 at a time):
 ┌──────────┐                        ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ Item 1   │──> done                │ Item 1   │ │ Item 2   │ │ Item 3   │
 ├──────────┤                        │ scrape   │ │ scrape   │ │ scrape   │
 │ Item 2   │──> done                │ AI       │ │ AI       │ │ AI       │
 ├──────────┤                        │ save     │ │ save     │ │ save     │
 │ Item 3   │──> done                └──────────┘ └──────────┘ └──────────┘
 │  ...     │                              ──> all settle ──>
 ├──────────┤                        ┌──────────┐ ┌──────────┐ ┌──────────┐
 │ Item 10  │──> done                │ Item 4   │ │ Item 5   │ │ Item 6   │
 └──────────┘                        └──────────┘ └──────────┘ └──────────┘
 ~100-120 seconds                         ~40-50 seconds
```

### Implementation Details

**1. Extract single-item processing into a helper function**

Pull the entire body of the current `for` loop (lines 728-1256) into:
```text
async function processOneItem(
  item, sb, job, agentId, firecrawlKey, lovableKey, jobId, domainCity
): Promise<{ succeeded: boolean }>
```

This function handles one item end-to-end: scrape, AI, validate, dedup, images, geocode, insert. It updates the item status in the DB itself and returns whether it succeeded.

**2. Process items in parallel chunks of 3**

Instead of `for (const item of pendingItems)`, chunk the 10 pending items into groups of 3 and use `Promise.allSettled`:

```text
const CONCURRENCY = 3;
for (let i = 0; i < pendingItems.length; i += CONCURRENCY) {
  const chunk = pendingItems.slice(i, i + CONCURRENCY);
  const results = await Promise.allSettled(
    chunk.map(item => processOneItem(item, ...))
  );
  // tally succeeded/failed from results
}
```

**3. Geocoding rate-limit guard**

Nominatim enforces 1 request/second. The current code makes one geocoding call per item. With 3 concurrent items, they'd all hit Nominatim simultaneously.

Solution: Use a simple shared mutex/queue for geocoding. A `geocodeWithRateLimit` wrapper that uses a shared promise chain to serialize geocoding calls with a 1.1-second gap:

```text
let lastGeoTime = 0;
async function geocodeWithRateLimit(address, city) {
  const now = Date.now();
  const wait = Math.max(0, 1100 - (now - lastGeoTime));
  if (wait > 0) await delay(wait);
  lastGeoTime = Date.now();
  // ...actual fetch...
}
```

**4. Image downloads -- parallel within each item**

Currently images are downloaded one at a time per item (line 1158: `for (const imgUrl of sourceImages.slice(0, 15))`). Change to `Promise.allSettled` with batches of 5 images at a time within each item. This alone saves significant time per item since image downloads are pure I/O.

**5. Timeout safety**

Edge functions have a ~150s hard timeout. Add a start-time check at the beginning of each chunk. If elapsed time exceeds 120 seconds, stop launching new chunks and return early with `remaining > 0` so the client calls another batch.

```text
const startTime = Date.now();
// Before each chunk:
if (Date.now() - startTime > 120_000) break; // safety margin
```

### Edge Cases and Gaps Addressed

| Concern | How it's handled |
|---|---|
| Firecrawl rate limits | 3 concurrent scrapes is well within typical API rate limits. Firecrawl allows much more than this. |
| AI gateway rate limits | Lovable AI gateway handles concurrent calls fine. 3 simultaneous is conservative. |
| Nominatim 1 req/sec | Serialized via shared rate-limit wrapper with 1.1s delay between calls. |
| DB write conflicts | Each item writes to its own row (by item.id) -- no conflicts possible. |
| One item crashing kills batch | `Promise.allSettled` ensures other items continue even if one throws. |
| Edge function timeout (150s) | Elapsed-time check before each chunk; exits early if > 120s. |
| Image download flooding | Capped at 5 concurrent image downloads per item, 15 images max. |
| Status tracking accuracy | Each item updates its own DB status independently. Final tally uses DB query (unchanged). |
| Error isolation | Each `processOneItem` has its own try/catch. Failures are logged per-item. |

### Expected Performance

- **Before**: 10 items at ~10-12s each = ~100-120 seconds per batch
- **After**: 10 items in chunks of 3 = ~4 chunks, ~10-12s per chunk = ~40-50 seconds per batch
- **Net improvement**: ~60% faster batch processing
- **No additional cost**: Same number of Firecrawl credits and AI calls, just run concurrently

### Technical Summary

Changes within `handleProcessBatch` only:

1. New helper: `processOneItem()` -- extracted from lines 728-1256
2. New helper: `geocodeWithRateLimit()` -- wraps Nominatim calls with 1.1s serialization
3. New helper: `parallelImageDownload()` -- downloads up to 5 images concurrently
4. Replace sequential `for` loop with chunked `Promise.allSettled` (concurrency = 3)
5. Add elapsed-time safety check before each chunk

No changes to discovery, retry, or any other functions.

