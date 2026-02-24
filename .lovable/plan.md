

## Pre-LLM Sold/Rented Filtering

### Problem
The current import pipeline relies solely on the AI model detecting sold/rented status via the `is_sold_or_rented` field. Hebrew terms like "נמכר" (sold), "הושכר" (rented), or English equivalents can be missed by the LLM, resulting in unavailable listings cluttering the dashboard.

### Solution
Add a deterministic keyword check on the scraped markdown **before** sending it to the AI for extraction. If the page content matches known sold/rented indicators, skip it immediately -- saving an AI call and preventing false positives.

### Changes

**File: `supabase/functions/import-agency-listings/index.ts`**

Add a helper function `isSoldOrRentedPage(markdown)` and call it in `handleProcessBatch` right after scraping succeeds (after the content-length check at line ~287, before the AI extraction prompt at line ~294).

**The helper function** scans the markdown for known patterns in Hebrew and English:

Hebrew terms:
- נמכר / נמכרה (sold, masculine/feminine)
- הושכר / הושכרה (rented, masculine/feminine)
- בהסכם (under contract)
- לא זמין (not available)
- אין בנמצא / לא פנוי (unavailable/not vacant)

English terms:
- sold, under contract, sale agreed
- rented, leased, let agreed
- off market, no longer available, under offer

The check uses case-insensitive regex matching and looks for these terms as whole words (not substrings of other words), to avoid false positives like "sold" appearing in "soldier".

**Logic flow:**
```text
1. Scrape page -> get markdown
2. Check markdown length (existing, line ~287)
3. NEW: Run isSoldOrRentedPage(markdown)
   - If true -> mark item as "skipped" with message
     "Pre-filter: listing appears sold/rented"
   - If false -> continue to AI extraction (existing flow)
4. AI extraction still has is_sold_or_rented as backup
```

This means there are now **two layers** of sold/rented detection:
- Layer 1 (new): Fast keyword scan -- catches obvious cases, saves AI credits
- Layer 2 (existing): AI extraction's `is_sold_or_rented` field -- catches nuanced cases the keywords miss

### Technical Details

The new function added near the top of the file:

```text
function isSoldOrRentedPage(markdown: string): boolean {
  // Hebrew patterns
  const hebrewPatterns = [
    /נמכר[הו]?/,        // sold (masc/fem/plural)
    /הושכר[הו]?/,       // rented (masc/fem/plural)
    /בהסכם/,            // under contract
    /לא\s*זמינ[הו]?/,   // not available
    /לא\s*פנוי[הו]?/,   // not vacant
    /אין\s*בנמצא/,       // unavailable
  ];

  // English patterns (word-boundary protected)
  const englishPatterns = [
    /\bsold\b/i,
    /\brented\b/i,
    /\bleased\b/i,
    /\bunder\s+contract\b/i,
    /\bunder\s+offer\b/i,
    /\bsale\s+agreed\b/i,
    /\blet\s+agreed\b/i,
    /\boff\s*market\b/i,
    /\bno\s+longer\s+available\b/i,
    /\bunavailable\b/i,
  ];

  // Check first ~2000 chars (status badges are usually near the top)
  const snippet = markdown.substring(0, 2000);

  for (const p of hebrewPatterns) {
    if (p.test(snippet)) return true;
  }
  for (const p of englishPatterns) {
    if (p.test(snippet)) return true;
  }
  return false;
}
```

Key design decisions:
- Only scans the **first 2000 characters** of the markdown -- sold/rented badges are almost always in the page header/title area, and this avoids false positives from body text like "recently sold in this area"
- Hebrew patterns don't use `\b` (word boundary doesn't work with Hebrew Unicode) -- instead relies on the specificity of the terms themselves
- The existing AI `is_sold_or_rented` check (line 563) remains as a safety net for edge cases

### No UI Changes
This is entirely a backend optimization. No frontend changes needed. Items filtered this way will show as "skipped" with a clear reason message in the existing UI.
