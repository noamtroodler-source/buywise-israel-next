

# Fix Yad2 Import: Date Sanitization + Skip Broken Image Functions

## Root Causes Confirmed

1. **`entry_date` receives Hebrew free text** (e.g. "גמישה") → Postgres rejects with `invalid input syntax for type date`. The current sanitizer on line 2217 only handles `"immediate"` but not arbitrary Hebrew strings.

2. **`compute-image-hash` and `optimize-image` crash** with `Invalid URL: 'magick.wasm'` on every call. Each image triggers both functions, wasting 5-10s per image and returning nothing useful. The `enhanceImage` function also adds latency.

3. **5 items per batch** because each item takes ~30s (AI extraction + broken image calls + geocoding), hitting the 120s wall clock limit after ~5 items.

## Implementation Plan

### 1. Sanitize `entry_date` before insert (line 2217)

Replace the current one-liner with a proper ISO date validator. Any value that isn't a valid `YYYY-MM-DD` date (or "immediate" → today) gets set to `null`.

```
// Before:
const entryDate = listing.entry_date === "immediate" ? new Date().toISOString().split("T")[0] : listing.entry_date || null;

// After:
function sanitizeEntryDate(raw: any): string | null {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim().toLowerCase();
  if (trimmed === "immediate" || trimmed === "מיידי" || trimmed === "מיידית") {
    return new Date().toISOString().split("T")[0];
  }
  // Only accept YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  // Try DD/MM/YYYY or DD.MM.YYYY
  const match = trimmed.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/);
  if (match) return `${match[3]}-${match[2].padStart(2,'0')}-${match[1].padStart(2,'0')}`;
  return null; // Hebrew text like "גמישה" → null
}
const entryDate = sanitizeEntryDate(listing.entry_date);
```

### 2. Skip broken `compute-image-hash` and `optimize-image` calls

Both functions crash with `magick.wasm` URL errors. They provide no value currently and waste ~5-10s per image.

- In `parallelImageDownload` (lines 1237-1242): Skip `enhanceImage` and `optimizeImage` calls. Just use the uploaded public URL directly.
- In `registerImageHashes` (lines 1171-1185): Skip the `computeImagePhash` calls entirely — return empty warnings immediately.

This cuts per-item time from ~30s to ~10-15s, allowing 8-10 items per batch instead of 5.

### 3. Reset failed items for the current job

Run a migration to reset the 2 failed items (date error) back to `pending` so they can be reprocessed.

### 4. Increase batch throughput

With image functions disabled, each item should take ~10-15s. Increase `MAX_ITEMS` from 15 to 25 to process more per invocation.

## Expected Result

- No more `invalid input syntax for type date` errors
- ~2x faster per-item processing (no broken image function calls)
- 8-10+ items per batch instead of 5
- Failed items reset and ready for reprocessing

