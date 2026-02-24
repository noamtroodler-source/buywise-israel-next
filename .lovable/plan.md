

## Batch AI Classification During Discovery

### Problem
The current discovery flow sends all ~300+ URLs in a single AI prompt (line 601). For large sites this can:
- Hit token limits (input + output), causing truncated or incomplete responses
- Overwhelm the model's attention, causing it to miss valid listing URLs
- Create a single point of failure -- if that one AI call fails, the entire discovery fails

### Solution
Split the URL list into chunks of ~80 URLs and run multiple AI classification calls in parallel (up to 3 concurrent). Merge results with deduplication.

### Architecture

```text
BEFORE (single call):                 AFTER (chunked + parallel):
┌──────────────────────┐              ┌──────────┐ ┌──────────┐ ┌──────────┐
│ 300+ URLs            │              │ URLs 1-80│ │ URLs     │ │ URLs     │
│ ──> 1 AI call        │              │ AI call 1│ │ 81-160   │ │ 161-240  │
│ ──> hope it works    │              │          │ │ AI call 2│ │ AI call 3│
└──────────────────────┘              └──────────┘ └──────────┘ └──────────┘
                                            ──> all settle ──>
                                      ┌──────────┐
                                      │ URLs     │
                                      │ 241-317  │
                                      │ AI call 4│
                                      └──────────┘
                                            ──> merge + deduplicate
```

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

**1. New helper function: `classifyUrlChunk()`**

Extracts the AI call logic (lines 582-651) into a reusable function that takes a subset of URLs and returns the listing URLs identified by AI:

```text
async function classifyUrlChunk(
  urls: string[],
  lovableKey: string
): Promise<string[]>
```

- Contains the same prompt and tool-calling setup
- Has its own try/catch -- if one chunk's AI call fails, others still succeed
- Returns empty array on failure (logged as warning, not fatal)

**2. New orchestrator: `classifyUrlsInBatches()`**

Replaces the single AI call with chunked parallel processing:

```text
async function classifyUrlsInBatches(
  allUrls: string[],
  lovableKey: string,
  chunkSize = 80,
  concurrency = 3
): Promise<string[]>
```

- Splits `allUrls` into chunks of 80
- Processes chunks in parallel groups of 3 using `Promise.allSettled`
- Merges all results into a single deduplicated array
- If ALL chunks fail, falls back to returning up to 100 URLs (same as current fallback)

**3. Update `handleDiscover()`**

Replace lines 579-655 with a call to `classifyUrlsInBatches()`. The prompt, tool definition, and response parsing remain identical -- they just move into the helper.

### Edge Cases Handled

| Concern | How it's handled |
|---|---|
| One chunk's AI call fails | `Promise.allSettled` -- other chunks still return results. Failed chunk logged as warning. |
| All chunks fail | Falls back to returning first 100 URLs (same as current behavior) |
| Duplicate URLs across chunks | Results merged into a `Set` before converting to array |
| Small sites (under 80 URLs) | Only 1 chunk created, 1 AI call made -- same behavior as today |
| AI rate limiting (429) | Chunks run in groups of 3 max. If 429 hit, that chunk returns empty + warning. Remaining chunks in next group may succeed after the delay. |
| Token limits per chunk | 80 URLs is well within token limits for Gemini Flash. Average URL is ~60 chars, so 80 URLs = ~5K chars input. |
| Ordering consistency | Results are deduplicated but order doesn't matter -- they become `import_job_items` rows. |
| Edge function timeout | 3-4 AI calls at ~3-5s each, running in parallel groups of 3 = ~6-10s total. Well within the 150s limit and faster than the current single large call. |

### Expected Results

- **Accuracy**: Better classification because the AI sees fewer URLs per call, reducing attention dilution
- **Reliability**: No more single-point-of-failure. Partial results are better than zero results.
- **Speed**: Parallel chunks (3 at a time) complete in roughly the same wall-clock time as the current single call, sometimes faster
- **Cost**: Same or marginally more AI tokens overall (prompt overhead repeated per chunk), but negligible difference
- **No behavioral change for small sites**: Sites with fewer than 80 URLs still make exactly 1 AI call

### Technical Summary

1. New helper: `classifyUrlChunk()` -- single AI call for a subset of URLs
2. New helper: `classifyUrlsInBatches()` -- orchestrates chunks with concurrency control
3. Update `handleDiscover()` lines 579-655 to call `classifyUrlsInBatches()` instead of inline AI logic
4. No changes to any other function (process_batch, retry, etc.)

