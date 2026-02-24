

## Scrape Index Pages to Pre-Filter Sold/Rented Listings

### Problem
The URL keyword filter only caught 4 URLs on jerusalem-real-estate.co because the site uses clean URLs without "sold" or "rented" in the path. The sold/rented status is only visible as a badge on the listing grid pages (index/category pages), not in the URL itself. This means 317 items enter the queue when many are sold -- each gets individually scraped and skipped, wasting Firecrawl credits and time.

### Solution
During discovery, after Firecrawl MAP finds all URLs and before the AI classifies them, scrape the site's listing index/category pages to find which individual listing URLs appear next to "sold" or "rented" badges. Remove those URLs before AI classification.

### How It Works

**Single file change:** `supabase/functions/import-agency-listings/index.ts`

#### Step-by-step in `handleDiscover`:

1. **Identify index pages from the mapped URLs** -- look for URLs matching common listing index patterns like `/properties`, `/for-sale`, `/listings`, `/נכסים`, `/דירות`, etc. Also include the homepage. Typically 3-10 pages.

2. **Batch-scrape these index pages using Firecrawl** (HTML format, not markdown, to preserve badge structure). Cost: ~3-8 Firecrawl credits.

3. **Parse each index page's HTML** to find listing cards/links that contain sold/rented signals nearby:
   - Look for `<a href="/property/xyz">` elements where the surrounding HTML (within ~500 chars) contains keywords like "sold", "נמכר", "rented", "הושכר", "under contract", "בהסכם"
   - Also detect CSS classes like `sold`, `rented`, `unavailable`, `off-market` on parent containers
   - Build a Set of "sold URLs" from this analysis

4. **Filter out sold URLs** from the `allUrls` list before passing to AI classification

5. **Log the count** of index-page-filtered URLs for transparency

#### Edge Cases Handled

- **Pagination**: Scrape up to 5 index pages (first few pages catch most sold listings). Sites with deep pagination won't block the process -- remaining sold listings are still caught by the existing per-item `isSoldOrRentedPage()` safety net during processing.
- **No index pages found**: If no index-pattern URLs are detected, skip this step gracefully and proceed as before.
- **Scrape failures**: If an index page fails to scrape, log a warning and continue. Never block discovery.
- **Hebrew content**: All regex patterns include Hebrew equivalents.
- **False positives**: Only mark a URL as sold if the sold keyword appears within close proximity to the link (not just anywhere on the page). This prevents filtering out an active listing just because a "Recently Sold" section exists elsewhere on the page.
- **URL normalization**: URLs extracted from HTML `href` attributes are normalized to absolute URLs and matched against the discovered URL list.

#### Expected Results

- **Cost**: Adds ~3-8 Firecrawl credits per discovery, but saves ~30-50 credits by not scraping individual sold pages during processing
- **Time**: Adds ~10-20 seconds to discovery, saves 2-5 minutes during processing
- **Effectiveness**: ~70-80% of sold listings caught at discovery. The remaining ~20-30% are still caught by the existing content-based check during individual processing.

### Technical Details

New helper function `findSoldUrlsFromIndexPages`:

```text
async function findSoldUrlsFromIndexPages(
  allUrls: string[], 
  websiteUrl: string, 
  firecrawlKey: string
): Promise<Set<string>>
```

Index page detection patterns:
```text
/properties, /listings, /for-sale, /for-rent, /our-listings,
/נכסים, /דירות, /למכירה, /להשכרה, /catalog, /portfolio
```

Sold badge detection patterns (in surrounding HTML context):
```text
English: sold, rented, leased, under contract, off market, 
         no longer available, sale agreed, let agreed
Hebrew:  נמכר, הושכר, בהסכם, לא זמין, לא פנוי
CSS:     class containing "sold", "rented", "unavailable", "off-market"
```

The existing URL keyword filter and per-item `isSoldOrRentedPage()` check remain untouched as additional safety nets.

