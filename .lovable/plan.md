
# Agency Listing Import Tool

## Overview
Build an end-to-end listing import pipeline that lets agency admins paste their website URL, discover all listing pages via Firecrawl, extract structured property data using AI, download and re-host images, and insert everything as draft properties ready for review.

## Architecture

```text
Agency Dashboard
      |
      v
"Import from Website" button
      |
      v
Step 1: DISCOVER (Firecrawl MAP)
   - Agency admin pastes website URL
   - Edge function calls Firecrawl MAP to find all URLs
   - AI filters listing URLs from non-listing pages
   - Creates import_jobs + import_job_items rows
      |
      v
Step 2: PROCESS BATCH (10 at a time)
   - Agency clicks "Import Next Batch"
   - Edge function grabs next 10 pending items
   - For each: Firecrawl SCRAPE -> AI EXTRACT -> Download images -> Insert property
   - Updates item status (done/failed)
      |
      v
Step 3: REVIEW
   - Imported drafts appear in existing Listings page
   - Agency admin edits/corrects/submits for review
   - Uses existing property editing UI (no new review UI)
```

## What Gets Built

### 1. Database Tables

**import_jobs** -- tracks each import session
- id, agency_id, website_url, status (discovering/ready/processing/completed/failed)
- total_urls, processed_count, failed_count
- discovered_urls (text array -- all URLs found by MAP)
- created_at, updated_at

**import_job_items** -- tracks each individual listing URL
- id, job_id, url
- status (pending/processing/done/failed/skipped)
- property_id (links to created property, nullable)
- error_message (why it failed, nullable)
- extracted_data (jsonb -- raw AI extraction for debugging)
- created_at

**Add column to properties table:**
- import_source (text, nullable) -- values: 'website_scrape', null for manual

RLS: Both tables restricted to agency admin via admin_user_id match.

### 2. Edge Function: `import-agency-listings`

Single edge function with two actions:

**Action: `discover`**
1. Receives agency_id + website_url
2. Calls Firecrawl MAP to get all URLs (up to 500)
3. Sends URL list to Lovable AI (Gemini Flash) with prompt: "Which of these URLs are individual property/listing pages? Return only the listing URLs."
4. Creates import_job + import_job_items for each listing URL
5. Returns job_id + total count

**Action: `process_batch`**
1. Receives job_id
2. Grabs next 10 pending items
3. For each item:
   a. Firecrawl SCRAPE (markdown + links format)
   b. Lovable AI extraction with tool-calling schema matching properties table fields
   c. Download each image URL, upload to `property-images` bucket under `imports/{job_id}/`
   d. Insert property as draft (verification_status='draft', import_source='website_scrape', is_published=false)
   e. Geocode via Nominatim (reuse existing pattern)
   f. Mark item as done/failed
4. Update job processed_count
5. Returns batch results + remaining count

**AI Extraction Schema** (via tool calling):
- title, description, price, currency (default ILS)
- bedrooms (total_rooms - 1 per Israeli convention), bathrooms
- size_sqm, address, city, neighborhood
- property_type (mapped from Hebrew: apartment/penthouse/house/etc.)
- listing_status (for_sale/for_rent)
- floor, total_floors, features[], parking
- entry_date, year_built, ac_type
- image_urls[] (extracted from page)
- Each field gets confidence: high/medium/low

**Duplicate Detection:** Before inserting, check if a property with matching address + city + similar price already exists for this agency. Skip if duplicate.

**Error Handling:**
- Individual item failures don't stop the batch
- Failed items get error_message logged
- Retryable failures stay as 'pending'
- Non-retryable (e.g., 404 page) marked as 'skipped'

### 3. Frontend: Import Tool UI

**New page: `src/pages/agency/AgencyImport.tsx`**
- Accessible from Agency Dashboard via new "Import Listings" button
- Step-by-step flow:
  1. Input URL + "Discover Listings" button
  2. Shows discovery progress, then "Found 47 listings"
  3. "Import Next Batch" button with progress bar (12 of 47 imported)
  4. Results summary: success count, failed count, skipped duplicates
  5. "View Imported Drafts" link to Listings page filtered by import_source

**New hook: `src/hooks/useImportListings.tsx`**
- useImportJobs(agencyId) -- fetch active/past import jobs
- useDiscoverListings() -- mutation to start discovery
- useProcessBatch() -- mutation to process next batch

### 4. Integration Points

- Route added to App.tsx: `/agency/import`
- Button added to AgencyDashboard header: "Import Listings" (with Download icon)
- Button added to AgencyListings header: "Import from Website"
- AgencyListings gets an "Imported" filter badge when import_source listings exist
- config.toml entry for `import-agency-listings` with verify_jwt = false

## Technical Details

### Files Created
| File | Purpose |
|------|---------|
| `supabase/functions/import-agency-listings/index.ts` | Main orchestrator edge function |
| `src/pages/agency/AgencyImport.tsx` | Import tool page UI |
| `src/hooks/useImportListings.tsx` | React Query hooks for import |

### Files Modified
| File | Change |
|------|--------|
| `src/App.tsx` | Add lazy import + route for AgencyImport |
| `src/pages/agency/AgencyDashboard.tsx` | Add "Import Listings" button |
| `src/pages/agency/AgencyListings.tsx` | Add "Import from Website" button + imported filter |
| `supabase/config.toml` | Add import-agency-listings function config |

### Database Migration
- Create `import_jobs` table with RLS
- Create `import_job_items` table with RLS
- Add `import_source` column to `properties` table

### Edge Cases Handled
- **Timeout safety**: 10 items per batch keeps well within 60s limit
- **Duplicate detection**: Address + city + price similarity check prevents double imports
- **Broken image URLs**: Try/catch per image; property still created with partial images
- **Non-listing URLs**: AI filtering + graceful skip for pages that don't contain listing data
- **Hebrew content**: AI prompt explicitly handles Hebrew property terms and Israeli conventions
- **Price formats**: Handles ₪, $, comma separators, "per month" indicators
- **Rate limiting**: Sequential Firecrawl calls within batch to avoid API limits
- **Agency authorization**: Edge function validates agency ownership via admin_user_id
