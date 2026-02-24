

## Dynamic Batch Sizing with Mid-Batch Refill

### Problem
The batch is fixed at 10 items fetched upfront (`.limit(10)`). With 3-way parallelism and a 120s timeout guard, this works well when all 10 items need full processing (~10-12s each). But when items are skipped quickly (404, sold/rented, too-short content), the function finishes early and wastes the remaining time window. For a site with many sold listings, a batch might complete in 15 seconds having only done real work on 3 items.

### Solution
Replace the fixed `.limit(10)` upfront fetch with a **refill loop** that fetches small batches of pending items and keeps processing until the time budget runs out. Instead of deciding how many items to grab at the start, the function continuously pulls more work as long as there's time remaining.

### Architecture

```text
BEFORE (fixed 10):                   AFTER (dynamic refill):
┌──────────────────────┐             ┌──────────────────────────────────┐
│ Fetch 10 items       │             │ LOOP until time runs out:        │
│ Process in 3s chunks │             │   Fetch next 6 pending items     │
│ Done (maybe early)   │             │   Process in 3s chunks           │
└──────────────────────┘             │   If all fast-skipped, loop now  │
 Total: 10 items max                 │   If time > 120s, stop           │
                                     └──────────────────────────────────┘
                                      Total: 10-30+ items depending on
                                      how many skip quickly
```

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

Only the `handleProcessBatch` function changes. `processOneItem` and all other functions remain untouched.

**Refactored `handleProcessBatch`:**

1. **Remove the single upfront `.limit(10)` query** (line 1296-1302)

2. **Replace with a refill loop:**
   - Each iteration fetches the next batch of 6 pending items from the DB
   - If 0 items returned, the job is complete -- break
   - Process the fetched items in chunks of 3 (same `Promise.allSettled` pattern)
   - After each chunk completes, check elapsed time
   - If elapsed > 120s, stop and return `remaining > 0`
   - Otherwise, loop back and fetch more items

3. **Why fetch 6 per refill (not more)?**
   - 6 items = 2 concurrent chunks of 3
   - If all 6 skip quickly (~2-3s), we immediately refill -- minimal wasted time
   - If all 6 need full processing (~20-25s for 2 chunks), we check the clock after and decide whether to refill
   - Fetching too many (e.g., 20) upfront reintroduces the original problem -- items sit in memory while we might timeout before reaching them
   - 6 is the sweet spot: small enough for fast refill cycles, large enough to amortize the DB query cost

4. **Track totals across refills:**
   - `totalProcessed`, `totalSucceeded`, `totalFailed` accumulate across all refill cycles
   - The final DB count query at the end stays the same

5. **Prevent re-fetching items being processed:**
   - The existing pattern already handles this: items are set to `status: "processing"` at the start of `processOneItem`, so the next `.eq("status", "pending")` fetch won't return them
   - No race condition possible because we `await` each chunk before fetching more

### Pseudocode

```text
async function handleProcessBatch(body) {
  // ... setup (job fetch, agent lookup, etc.) -- unchanged

  const batchStartTime = Date.now();
  const CONCURRENCY = 3;
  const REFILL_SIZE = 6;
  const TIME_LIMIT_MS = 120_000;

  let totalProcessed = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  // Reset geocode rate limiter
  _lastGeoTime = 0;
  _geoQueue = Promise.resolve();

  while (true) {
    // Time check before fetching more work
    if (Date.now() - batchStartTime > TIME_LIMIT_MS) {
      console.log("Time limit reached, stopping refill loop");
      break;
    }

    // Fetch next batch of pending items
    const { data: pendingItems } = await sb
      .from("import_job_items")
      .select("*")
      .eq("job_id", job_id)
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(REFILL_SIZE);

    if (!pendingItems || pendingItems.length === 0) break; // All done

    // Process in chunks of CONCURRENCY
    for (let i = 0; i < pendingItems.length; i += CONCURRENCY) {
      if (Date.now() - batchStartTime > TIME_LIMIT_MS) break;

      const chunk = pendingItems.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(item => processOneItem(item, ...))
      );

      for (const result of results) {
        totalProcessed++;
        if (result.status === "fulfilled" && result.value.succeeded) {
          totalSucceeded++;
        } else {
          totalFailed++;
        }
      }
    }
  }

  // Final count query and status update -- same as current
  // ...
}
```

### Edge Cases and Gaps Addressed

| Concern | How it's handled |
|---|---|
| All items skip fast (many sold) | Loop refills rapidly, processing 20-30+ items in the same time window that used to handle 10 |
| All items need full processing | First refill of 6 takes ~20-25s for 2 chunks, second refill of 6 takes another ~20-25s, time check kicks in after ~3-4 refills (18-24 items). Very similar to the old behavior of ~10 items. |
| Mix of fast and slow items | Fast items clear quickly, freeing time for more refills. Naturally adaptive. |
| DB query overhead per refill | A simple indexed query (`job_id + status + order by created_at + limit 6`) takes <50ms. Negligible compared to scraping time. |
| Race condition on refetch | Items are marked `status: "processing"` at the start of `processOneItem`, before `await` yields. The next refill query filters `status = "pending"` so it won't re-fetch. |
| Edge function timeout (150s) | Same 120s safety check, now checked both before each refill AND before each chunk within a refill. |
| Job marked completed prematurely | Only marked completed when refill returns 0 items AND no items were in-flight. The final DB count query is the source of truth. |
| Geocoding rate limiter state | Reset once at the start, shared across all refills (same as before). |
| Client-side `useProcessAll` loop | No change needed. Each `process_batch` call returns `remaining` count. The client loop continues calling until `remaining === 0`. With dynamic batching, each call now processes more items, so fewer total calls are needed. |
| Reporting accuracy | `totalProcessed` counts all items touched across refills. The final DB count query gives the authoritative `remaining` count. |

### Expected Performance

- **Mostly-active sites** (few skips): Processes ~12-18 items per call instead of 10. ~20-40% more throughput.
- **High-skip sites** (many sold/404): Processes ~25-40 items per call instead of 10. ~150-300% more throughput.
- **Mixed sites**: Naturally adapts. Fast items are consumed quickly, freeing time for more work.
- **Client-side**: Fewer `process_batch` calls needed overall, which means fewer edge function invocations and faster total import time.

### Technical Summary

1. Replace fixed `.limit(10)` fetch with a `while (true)` refill loop that fetches 6 items at a time
2. Process each refill's items in chunks of 3 (same `Promise.allSettled` concurrency pattern)
3. Check elapsed time (120s limit) before each refill and before each chunk
4. Accumulate totals across refills
5. Final DB count query and status update remain unchanged
6. `processOneItem` and all other functions are untouched
7. No changes needed to the client-side hooks (`useProcessAll`, `useProcessBatch`)
