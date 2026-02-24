

## Pre-Filter Non-Listing URL Patterns Before AI Classification

### Problem
The discovery flow sends all discovered URLs to the AI for classification, including URLs that are obviously not property listings -- pages like `/about`, `/contact`, `/blog/post-title`, `/team`, `/privacy-policy`, `/terms`, etc. These waste AI tokens and attention, reducing both speed and accuracy.

### Solution
Add a regex-based pre-filter between the existing sold-keyword filter and the AI classification call. This removes URLs matching common non-listing patterns before any AI call is made.

### What Changes

**Single file:** `supabase/functions/import-agency-listings/index.ts`

**New function: `filterNonListingUrls(urls: string[]): { listingCandidates: string[], removed: number }`**

Placed right after the existing sold-keyword filter (around line 707) and before the AI classification call (line 712).

### Filter Strategy

The filter uses two complementary approaches:

**1. Path-segment blocklist (exact segment match)**
Matches URL path segments exactly (between slashes) to avoid false positives. For example, `/about` is blocked but `/about-project-x` is not.

Blocked segments:
```text
about, contact, team, careers, jobs, privacy, terms, legal, disclaimer,
login, signin, signup, register, auth, account, dashboard, admin, panel,
blog, news, press, media, faq, help, support, sitemap, accessibility,
cookie, cookies, cart, checkout, payment, subscribe, unsubscribe,
partners, affiliates, investors, testimonials, reviews, awards
```

**2. File-extension blocklist**
Removes URLs ending in non-HTML extensions:
```text
.pdf, .jpg, .jpeg, .png, .gif, .svg, .webp, .mp4, .mp3, .zip, .doc, .docx, .xls, .xlsx, .css, .js, .xml, .json, .rss, .atom
```

**3. Fragment/anchor-only and query-heavy URLs**
Removes URLs that are just anchors (`#section`) on the same page or have no meaningful path (just `/` or empty).

### Why Exact Segment Matching (Not Substring)

Substring matching would cause false positives:
- `/properties/about-view-apartment` -- contains "about" but IS a listing
- `/sale/contact-us-for-details` -- contains "contact" but could be a listing path
- `/blog-project-luxury-tower` -- contains "blog" but is a project page

Exact segment matching splits the path by `/` and checks each segment independently, so only `/about/` or `/about` (as a full segment) triggers the filter.

### Integration Point

```text
Existing flow:
  1. Firecrawl map  -->  rawUrls (300+)
  2. Sold keyword filter  -->  allUrls (280)
  3. Index page sold filter  -->  allUrls (260)
  4. AI classification  -->  listingUrls (120)   <-- expensive

New flow:
  1. Firecrawl map  -->  rawUrls (300+)
  2. Sold keyword filter  -->  allUrls (280)
  3. Index page sold filter  -->  allUrls (260)
  4. **Non-listing pattern filter  -->  allUrls (200)**   <-- new, instant
  5. AI classification  -->  listingUrls (110)   <-- fewer URLs = cheaper + more accurate
```

### Edge Cases Handled

| Concern | How it's handled |
|---|---|
| Hebrew/encoded URLs | `decodeURIComponent` before checking segments, with try/catch fallback |
| `/about-this-project` false positive | Exact segment match only -- `about` as a segment, not substring |
| Root URL `/` | Kept (not filtered) -- the homepage might be needed for context |
| Query parameters on listing URLs | Only the pathname is checked, query params are ignored |
| URLs with mixed case | Lowercased before matching |
| Aggressive filtering removes real listings | The blocklist is conservative -- only universally non-listing terms. Better to send a few extra to AI than miss a listing. |
| Empty result after filtering | If filter removes everything, skip it and pass all URLs to AI (safety check) |

### Expected Impact

- **10-30% fewer URLs** sent to AI classification
- **Faster discovery**: fewer URLs = fewer/smaller AI chunks
- **Better accuracy**: AI focuses on actual listing candidates, less noise
- **Zero cost**: pure regex, runs in microseconds
- **No risk**: only removes URLs that are definitively not listings

### Technical Summary

1. New function `filterNonListingUrls()` with segment-based blocklist + file extension filter
2. Called in `handleDiscover()` between the index-page sold filter and AI classification
3. Safety check: if filter would remove ALL URLs, skip it entirely
4. Logging: reports how many URLs were removed for debugging
5. No changes to any other function

