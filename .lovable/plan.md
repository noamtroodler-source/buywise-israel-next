

## Import Neighborhood Guides into Database

### What you have
- **2,784-line markdown file** with neighborhood guides for Jerusalem, Tel Aviv, and other cities
- **Existing `neighborhood_profiles` table** with `narrative` and `best_for` columns
- **Existing `import-neighborhood-narratives` edge function** that parses exactly this `## City — Neighborhood` format

### Plan

**Step 1: Import the data via the existing edge function**
- Copy the markdown file content and call the `import-neighborhood-narratives` edge function directly using the Supabase curl tool
- The function parses `## City — Neighborhood` headers, extracts narrative text and `**Best for:**` content, and upserts into `neighborhood_profiles`
- Existing rows get updated; new rows get created

**Step 2: Verify the import**
- Query the database to confirm row counts and spot-check a few neighborhoods (e.g., Jerusalem — Baka, Jerusalem — Abu Tor)
- Ensure `narrative` and `best_for` fields are populated correctly

### What this gives you
- All neighborhood guides stored in the database permanently
- The `NeighborhoodContextCard` component on property/project pages will automatically display narratives and "Best for" callouts for any matching neighborhood
- The Ask BuyWise chatbot can reference this data when answering neighborhood questions
- You can update/add guides anytime via the admin import page at `/admin/import-neighborhood-profiles`

### No code changes needed
This is purely a data import into your existing infrastructure. No schema changes, no new components.

