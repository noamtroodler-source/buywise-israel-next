

# Plan: Fix Scraping Pipeline — 3 Critical Issues

## Problem Summary

Out of ~5,800 items discovered, only **35 succeeded**, **700 failed**, and **4,115 are stuck pending**. Three root causes:

---

## Issue 1: `verification_status: "verified"` crashes all inserts (223 failures)

The code sets `verification_status: "verified"` for high-confidence listings, but the database enum only allows: `draft`, `pending_review`, `changes_requested`, `approved`, `rejected`.

**Fix:** In `import-agency-listings/index.ts` line ~2554, change `"verified"` → `"approved"` and the fallback `"draft"` stays as-is.

---

## Issue 2: Scrape failures — 401 (325) and 500 (90) errors

Most failures are Firecrawl returning 401/500 for individual listing pages. These are likely anti-bot blocks or timeouts on specific sites.

**Fix:** 
- Add retry logic (1 retry with 2s delay) for 401/500 responses in the `scrapeOnePage` function
- For persistent 401s, mark as "blocked" rather than retrying forever
- Reduce batch concurrency from 5 → 3 to lower pressure on Firecrawl

---

## Issue 3: 4,115 items stuck in "pending" — self-chaining stalls

The self-chaining mechanism fires but batches process slowly (25 items in ~120s), and edge function timeouts cause chains to break, leaving thousands of items orphaned.

**Fix:**
- In `nightly-scrape-scheduler`, after all waves complete, add a cleanup pass that re-triggers any jobs with remaining pending items
- Add a stall-detection check: if a job has pending items but no activity for 10+ minutes, re-fire `process_batch`

---

## Implementation Plan

| Step | File | Change |
|------|------|--------|
| 1 | `import-agency-listings/index.ts` | Fix enum: `"verified"` → `"approved"` |
| 2 | `import-agency-listings/index.ts` | Add retry for 401/500 in scrape function |
| 3 | `import-agency-listings/index.ts` | Reduce default concurrency to 3 |
| 4 | `nightly-scrape-scheduler/index.ts` | Add stall recovery pass after waves complete |
| 5 | Deploy both functions | Verify with a test source |

Step 1 alone should immediately fix ~220+ failures per run. Steps 2-3 should recover another ~300+. Step 4 ensures pending items don't get orphaned.

