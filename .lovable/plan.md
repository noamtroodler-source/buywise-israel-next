

## Plan: Import 50 Israeli Developers into Database

### Step 1 — Add missing columns to `developers` table

The existing table covers name, slug, founded_year, office_city, website, description, specialties, company_type. But the spreadsheet has data that needs new columns:

| New Column | Type | Purpose |
|---|---|---|
| `regions_active` | `text[]` | Cities/regions the developer operates in |
| `is_publicly_traded` | `boolean` | Whether listed on TASE |
| `tase_ticker` | `text` | Stock ticker symbol |
| `notable_projects` | `text[]` | Up to 5 notable project names |
| `awards_certifications` | `text` | Public awards or certifications |
| `completed_projects_text` | `text` | Free-text approximation (e.g. "190,000+ units") |

A single migration adds these 6 columns.

### Step 2 — Insert all 50 developers

Use the data insert tool to bulk-insert all 50 developers from the spreadsheet. Each row maps to:

- `name` — Company Name
- `slug` — auto-generated from name (lowercase, hyphens)
- `founded_year` — Founded Year
- `office_city` — Office City
- `total_projects` — left as-is (numeric where possible)
- `completed_projects_text` — the raw "190,000+ units" string
- `description` / `specialties` — Specialization field
- `website` — Website URL
- `awards_certifications` — Awards column
- `regions_active` — Regions/Cities Active
- `is_publicly_traded` / `tase_ticker` — Publicly Traded + Ticker
- `notable_projects` — Notable Project Names (split into array)
- `status` — set to `active` (these are unclaimed public profiles)
- `is_verified` — `false` (unclaimed)
- `user_id` — `null` (unclaimed profiles)

All 50 rows will be inserted. No code changes needed since developer pages already render available fields, and new columns will surface naturally as we build out the directory.

### Step 3 — Update Developer type definitions

Add the new fields to `src/types/projects.ts` (`Developer` interface) and `src/hooks/useDeveloperProfile.tsx` (`DeveloperProfile` interface) so they're available in the UI.

### Files changed
- **Migration**: new migration adding 6 columns
- **Data insert**: 50 developer rows
- `src/types/projects.ts` — add new fields to `Developer`
- `src/hooks/useDeveloperProfile.tsx` — add new fields to `DeveloperProfile`

