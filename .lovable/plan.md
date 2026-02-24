

## Lightweight HEAD Pre-Check Before Firecrawl Scrape

### Problem
Every item in `processOneItem` immediately calls the Firecrawl scrape API (line 921), which costs a Firecrawl credit and takes 3-8 seconds. Many URLs are dead links (404, 410, 451), server errors (500, 502, 503), or redirect to generic pages (homepage, category page). A free `fetch()` HEAD request can detect these before spending a credit.

### Solution
Add a `HEAD` request (with `GET` fallback) before the Firecrawl scrape call inside `processOneItem`. This catches:
- **Dead links**: 404, 410, 451 -- skip immediately
- **Server errors**: 500, 502, 503 -- skip (server-side issue, scrape would fail too)
- **Redirects to homepage/category**: If the final URL after redirects is the site root or a known non-listing pattern, skip
- **Connection failures**: DNS errors, timeouts -- skip gracefully

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

**1. New helper function: `preCheckUrl(url: string): Promise<{ ok: boolean; skipReason: string | null; finalUrl: string | null }>`**

Placed near the other utility functions (before `processOneItem`).

```text
async function preCheckUrl(url: string): Promise<{
  ok: boolean;
  skipReason: string | null;
  finalUrl: string | null;
}> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    // Try HEAD first (cheapest), fall back to GET if HEAD is blocked (405)
    let response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)",
      },
    });

    // Some servers reject HEAD requests
    if (response.status === 405 || response.status === 403) {
      response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; PropertyImporter/1.0)",
        },
      });
    }

    clearTimeout(timeout);

    const status = response.status;
    const finalUrl = response.url; // URL after redirects

    // Dead links
    if (status === 404 || status === 410 || status === 451) {
      return { ok: false, skipReason: `HTTP ${status} — page not found`, finalUrl };
    }

    // Server errors
    if (status >= 500) {
      return { ok: false, skipReason: `HTTP ${status} — server error`, finalUrl };
    }

    // Check if redirect landed on homepage (common for deleted listings)
    if (finalUrl !== url) {
      try {
        const originalPath = new URL(url).pathname;
        const finalPath = new URL(finalUrl).pathname;
        // Redirected to root = listing was removed
        if (finalPath === "/" && originalPath !== "/") {
          return { ok: false, skipReason: `Redirected to homepage (listing removed)`, finalUrl };
        }
      } catch { /* URL parse failed, continue anyway */ }
    }

    return { ok: true, skipReason: null, finalUrl };
  } catch (err: any) {
    // Network errors (DNS failure, connection refused, timeout)
    if (err.name === "AbortError") {
      return { ok: false, skipReason: "Pre-check timed out (8s)", finalUrl: null };
    }
    return { ok: false, skipReason: `Pre-check network error: ${err.message?.slice(0, 100)}`, finalUrl: null };
  }
}
```

**2. Insert pre-check call in `processOneItem`**

Between the status update to "processing" (line 917) and the Firecrawl scrape (line 921):

```text
// 0. Lightweight pre-check (free, no Firecrawl credit)
const preCheck = await preCheckUrl(item.url);
if (!preCheck.ok) {
  console.log(`Pre-check skip: ${item.url} — ${preCheck.skipReason}`);
  await sb.from("import_job_items")
    .update({ status: "skipped", error_message: preCheck.skipReason })
    .eq("id", item.id);
  return { succeeded: false };
}
```

### Edge Cases Handled

| Concern | How it's handled |
|---|---|
| Server blocks HEAD requests (405/403) | Falls back to GET automatically |
| Slow/hanging servers | 8-second AbortController timeout -- doesn't block the batch |
| CORS / opaque responses | Not an issue -- this runs server-side in the edge function, not in a browser |
| Redirect chains (301/302/307) | `redirect: "follow"` follows the chain; we check the final URL |
| Redirect to homepage | Detected by comparing final pathname to "/" -- marks as "listing removed" |
| Redirect to similar listing page | Allowed through (not filtered) since the destination might be a valid listing |
| SSL certificate errors | Caught by the try/catch, skipped with a descriptive error message |
| DNS failures | Caught by the try/catch, skipped gracefully |
| URL with query params redirects to same URL without params | Not treated as homepage redirect (pathname is compared, not full URL) |
| Pre-check passes but Firecrawl still fails | No change to existing Firecrawl error handling -- it still catches 404s etc. at that layer too |
| Extra latency for valid URLs | HEAD requests typically complete in 100-300ms -- negligible vs. the 3-8s Firecrawl scrape that follows |
| Rate limiting (429) from the target site | Allowed through (not skipped) -- the site might just be rate-limiting HEAD requests but serve content fine to Firecrawl's infrastructure |

### Why Not Skip on All Non-2xx?

Some status codes should NOT cause a skip:
- **429 (Too Many Requests)**: Target site rate-limiting our lightweight check, but Firecrawl has its own IP pool and retry logic
- **401/403**: Some sites require JS rendering or specific headers that Firecrawl handles
- **3xx**: Already handled via `redirect: "follow"`

Only definitive "this page does not exist" codes (404, 410, 451) and server failures (5xx) trigger a skip.

### Expected Impact

- **Saves 1 Firecrawl credit per dead/redirected link** (typically 5-15% of URLs)
- **Saves 3-8 seconds per skipped URL** (no waiting for Firecrawl to scrape a dead page)
- **Cost: ~100-300ms per URL** for the HEAD request on valid URLs
- **Net effect**: For a batch of 6 items with 2 dead links, saves ~10s and 2 credits, costs ~1.5s in HEAD requests = ~8.5s net savings

### Technical Summary

1. New `preCheckUrl()` function with HEAD-first, GET-fallback strategy and 8s timeout
2. Called at the top of `processOneItem`, before the Firecrawl scrape
3. Skips on 404/410/451, 5xx, homepage redirects, and network errors
4. Passes through on 2xx, 429, 401/403 (let Firecrawl handle these)
5. No changes to any other function or the batch loop
6. No new dependencies

