

# Skip Projects/Developments During Import

## What's Changing
The bulk import will only pull in **resale and rental listings** (individual properties). All project/development pages will be filtered out and skipped at every stage of the pipeline.

## Why
Project pages (new construction developments) have a fundamentally different data structure -- they represent groups of unit types, not individual listings. Importing them as flat entries creates messy, inaccurate data. Agencies should add projects manually via the Project Wizard where they can properly set up unit types, construction timelines, and developer details.

## Changes (all in one file: the import backend function)

### 1. URL Discovery -- Stop Including Project URLs
The AI URL classifier currently looks for both listing pages AND project/development pages. Update the prompt to explicitly **exclude** project/development URLs:
- Remove instructions telling it to look for `/project/`, `/development/`, `/new-construction/`, etc.
- Add project-related URL segments to the exclusion list
- Update the tool description to say "individual listing URLs only"

### 2. URL Pre-Filtering -- Block Project URL Patterns
Add project-related path segments to the existing URL pre-filter so they're rejected before any scraping or AI credits are spent:
- Segments like `project`, `development`, `new-construction`, `new-building`, `פרויקט`, `בנייה-חדשה`, `דירות-חדשות`, `מתחם`

### 3. AI Extraction -- Skip Project Pages Post-Extraction
If a page somehow makes it through the URL filters and the AI classifies it as `"project"`, treat it the same as `"not_listing"` -- mark the item as **skipped** with a clear message like "Project/development page -- skipped (add projects manually)".

### 4. Clean Up Dead Code
Remove (or leave inert) the `validateProjectData` function and the entire project insertion block (lines ~1288-1377) since they'll never be reached. This keeps the code clean and avoids confusion.

## What Users Will See
- Fewer wasted AI credits during import (project pages won't be scraped or processed)
- Skipped project URLs will show a clear "Project page -- add manually" message in the import results
- No change to the manual Project Wizard workflow

## Technical Details

**File:** `supabase/functions/import-agency-listings/index.ts`

| Area | Current Behavior | New Behavior |
|------|-----------------|-------------|
| URL pre-filter segments | Blocks `/about`, `/blog`, etc. | Also blocks `/project`, `/development`, `/new-construction`, Hebrew equivalents |
| AI URL classifier prompt | "identify listing OR project URLs" | "identify listing URLs only, EXCLUDE projects" |
| AI extraction category | Handles `property`, `project`, `not_listing` | `project` treated same as `not_listing` (skipped) |
| Project insert code | Full insertion path with geocoding, images | Removed -- dead code cleanup |

