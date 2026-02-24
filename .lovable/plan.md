

## Filter Out Sold/Rented Listings During Import

### Problem
The scraper currently imports all listings it finds, including ones marked as sold (נמכר) or rented (הושכר). These shouldn't be imported as draft listings.

### Solution
Add an `is_sold_or_rented` boolean to the AI extraction schema. The AI will detect sold/rented indicators in the page content and flag them. Flagged listings get skipped with a clear reason.

### Technical Changes

**File: `supabase/functions/import-agency-listings/index.ts`**

1. **Update the extraction prompt** (around line 247) -- add instruction:
   - "Detect if the listing is marked as sold (נמכר), rented (הושכר), under contract (בהסכם), or otherwise no longer available. Set is_sold_or_rented=true if so."

2. **Add `is_sold_or_rented` to the tool-calling schema** (around line 306) -- add the field alongside `is_listing_page`:
   - `is_sold_or_rented: { type: "boolean", description: "True if listing is sold, rented, or no longer available" }`

3. **Add skip logic after extraction** (around line 345, right after the `is_listing_page` check) -- if `listing.is_sold_or_rented === true`, mark the item as `skipped` with error message "Listing is sold or rented" and continue to the next item.

This approach is reliable because the AI reads the full page content and can detect Hebrew indicators like נמכר, הושכר, sold, rented, under contract, etc. -- regardless of whether the URL itself gives any hint.
