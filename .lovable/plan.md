

## Filter Out Sold/Rented Listings During Discovery (Step 1)

### Current Behavior
Right now, ALL listing URLs are discovered and added as import job items (296 in your case). Sold/rented listings are only detected later during processing -- each one gets scraped, checked, and marked as "skipped", wasting time and Firecrawl credits.

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

#### 1. URL-level pre-filter before AI classification

After Firecrawl maps all URLs but before sending them to the AI for classification, filter out URLs whose path/slug contains sold/rented keywords:

```text
Keywords to check in URL: sold, rented, leased, נמכר, הושכר, sold-out, 
under-contract, בהסכם, past-sales, archive, completed
```

This catches URLs like `/property/sold-apartment-123` or `/נמכר/דירה-בירושלים` before they even get classified.

#### 2. Update the AI URL-classification prompt

Add explicit instructions to the AI prompt that filters URLs:
- "Exclude any URLs that appear to be sold, rented, archived, or completed listings"
- "Only return URLs for active/live listings that are currently for sale or for rent"

This way the AI will also skip URLs that have subtler sold/rented signals in their URL structure.

#### 3. Result

- Discovery will return fewer items (e.g., maybe 250 instead of 296)
- No sold/rented listings will appear in the pending queue
- The existing per-item sold/rented check during processing remains as a safety net (in case a URL looked normal but the page content reveals it's sold)

### Technical Details

In the `handleDiscover` function:

1. After `allUrls` is populated from Firecrawl map, add a filter step:
```text
const SOLD_URL_KEYWORDS = [
  'sold', 'rented', 'leased', 'archived', 'completed',
  'past-sale', 'under-contract',
  '%D7%A0%D7%9E%D7%9B%D7%A8',  // נמכר URL-encoded
  '%D7%94%D7%95%D7%A9%D7%9B%D7%A8', // הושכר URL-encoded
];

const liveUrls = allUrls.filter(url => {
  const lower = decodeURIComponent(url).toLowerCase();
  return !SOLD_URL_KEYWORDS.some(kw => lower.includes(kw));
});
```

2. Pass `liveUrls` (instead of `allUrls`) to the AI classification prompt.

3. Add to the AI prompt: "Only return URLs for active, live listings currently for sale or for rent. Exclude sold, rented, archived, or completed listings."

