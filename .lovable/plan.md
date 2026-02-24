

## Add Project/Development Detection to the Import Scraper

### What Changes

When the scraper encounters a page that's a **new development / project** (rather than an individual resale or rental listing), it will recognize it and insert it into the `projects` table instead of `properties`.

### How It Works

1. **AI Detection** -- The extraction schema gets a new field `listing_category` with values: `"property"`, `"project"`, or `"not_listing"`. The AI prompt is updated to explain the difference:
   - **Property**: A single unit for sale or rent (resale, rental)
   - **Project/Development**: A new construction project with multiple units, marketed by a developer (may use words like "פרויקט", "project", "development", "new construction", "בנייה חדשה", etc.)

2. **Separate extraction schema for projects** -- When the AI identifies a page as a project, a second tool-call schema captures project-specific fields: `name`, `description`, `city`, `neighborhood`, `address`, `price_from`, `price_to`, `total_units`, `status` (construction stage), `completion_date`, `amenities`, and `image_urls`.

3. **Branching insert logic** -- After extraction:
   - If `listing_category === "project"` -> insert into `projects` table (with `verification_status: 'draft'`, `is_published: false`)
   - If `listing_category === "property"` -> existing flow (insert into `properties`)
   - If `"not_listing"` -> skip as before

4. **Database changes**:
   - Add `project_id` column (nullable UUID) to `import_job_items` so we can track which imports became projects vs properties
   - Add `import_source` column to `projects` table (like properties already has) to mark scraped projects

5. **Frontend** -- The import results page already shows items by status. No major UI changes needed; the `extracted_data` JSON will contain the category info for reference.

### Technical Details

**File: `supabase/functions/import-agency-listings/index.ts`**

- **Discovery phase (lines 61-72)**: Update the URL filtering prompt to also look for project/development page URLs (e.g., `/project/`, `/פרויקט/`, `/development/`)
- **Extraction prompt (lines 247-264)**: Add instructions to detect project pages and set `listing_category`
- **Extraction schema (lines 283-311)**: Add `listing_category` field with enum `["property", "project", "not_listing"]`. Add project-specific optional fields: `project_name`, `price_from`, `price_to`, `total_units`, `completion_date`, `construction_status`
- **Processing logic (lines 346-475)**: After extraction, branch on `listing_category`:
  - `"project"` -> insert into `projects` table with scraped data, store `project_id` on the job item
  - `"property"` -> existing property insert flow
  - `"not_listing"` -> skip
- **Duplicate detection for projects (new)**: Check `projects` table by name + city before inserting

**Database migration**:
```sql
ALTER TABLE import_job_items ADD COLUMN project_id UUID REFERENCES projects(id);
ALTER TABLE projects ADD COLUMN import_source TEXT;
```

This approach uses a single scrape + single AI call per page. The AI determines the category and extracts the right fields in one pass, keeping costs and latency the same.
