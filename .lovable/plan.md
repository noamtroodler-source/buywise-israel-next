

# Enhance Project Map Cards with Richer Info

## What We're Adding

Four improvements to both the map popup overlay and the sidebar project cards:

1. **Price range** -- show "From X - Y" instead of just "From X" (when `price_to` exists)
2. **Developer logo** -- small circular logo next to the project name
3. **Bedroom range** -- "2-5 bed" derived from project units data
4. **Construction stage label** -- "Pre-Sale", "Under Construction", etc. appended to the location line

## Technical Approach

### Data Availability

- `price_to` -- already on the `projects` table, already fetched
- `developer.logo_url` -- already joined via `developer:developer_id(*)`
- `status` -- already on the project, just needs a human-readable label
- Bedroom range -- NOT currently available on the project object. The `project_units` table has `bedrooms` per unit, but it's not joined in the map query

### Step 1: Add Bedroom Range to Projects (Database)

Add two columns to the `projects` table: `min_bedrooms` and `max_bedrooms` (both nullable integers). Then backfill them from existing unit data with a one-time UPDATE + create a trigger so they stay in sync when units change.

This avoids joining `project_units` on every map query (which could be expensive with many projects).

```text
SQL migration:
- ALTER TABLE projects ADD COLUMN min_bedrooms integer, ADD COLUMN max_bedrooms integer
- UPDATE projects SET min_bedrooms = ..., max_bedrooms = ... FROM project_units subquery
- CREATE FUNCTION + TRIGGER to auto-sync on unit INSERT/UPDATE/DELETE
```

### Step 2: Update MapProjectOverlay (popup card)

Changes to `src/components/map-search/MapProjectOverlay.tsx`:

- **Price line**: Change from `From $1.2M` to `From $1.2M - $3.5M` when `price_to` exists
- **Developer logo**: Add a small 20px circular image next to the project name (inline-flex row). Skip if no `developer?.logo_url`
- **Stats line**: Change from `89 units` to `2-5 bed . 89 units` using `min_bedrooms`/`max_bedrooms`
- **Location line**: Append construction status -- `Tel Aviv . Under Construction . Est. 2028`

### Step 3: Update MapProjectCard (sidebar card)

Same content changes to `src/components/map-search/MapProjectCard.tsx`:

- **Price line**: Show full range
- **Project name row**: Add developer logo (small circle) before the name
- **Stats line**: Include bedroom range
- **Location line**: Include construction stage

### Step 4: Status Label Helper

Create a small shared utility or inline the status label mapping (reusing the pattern already in `ProjectHero.tsx`):

```text
planning      -> "Planning"
pre_sale      -> "Pre-Sale"
foundation    -> "Foundation"
structure     -> "Structure"  
finishing     -> "Finishing"
under_construction -> "Under Construction"
completed     -> "Completed"
delivery      -> "Delivery"
```

### Step 5: Update useMapProjects Query

Update `src/hooks/useMapProjects.tsx` to include the new `min_bedrooms` and `max_bedrooms` columns in the select (they'll come automatically with `*`, but we need to update the TypeScript type).

### Step 6: Update Project Type

Add `min_bedrooms` and `max_bedrooms` to the `Project` interface in `src/types/projects.ts`.

## Result

The card layout stays compact with the same number of lines:

```text
[Image carousel + badge + favorite]

From $1.2M - $3.5M
[dev logo] The Gardens Tel Aviv
2-5 bed . 89 units
Tel Aviv . Under Construction . Est. 2028
```

No new lines added -- just enriching existing ones.

## Files to Modify

1. **Database migration** -- add `min_bedrooms`/`max_bedrooms` columns + backfill + trigger
2. `src/types/projects.ts` -- add optional fields
3. `src/components/map-search/MapProjectOverlay.tsx` -- enrich info section
4. `src/components/map-search/MapProjectCard.tsx` -- enrich info section

