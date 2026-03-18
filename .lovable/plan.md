

## Plan: Store Neighborhood Research Data and Build Context Card

### Database

**New table: `neighborhood_profiles`**

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| city | text NOT NULL | e.g. "Jerusalem" |
| neighborhood | text NOT NULL | e.g. "Baka" |
| reputation | text | Reputation & Positioning |
| physical_character | text | Physical Character |
| proximity_anchors | text | Proximity Anchors |
| anglo_community | text | Anglo/International Community |
| daily_life | text | Daily Life Infrastructure |
| transit_mobility | text | Transit & Mobility |
| honest_tradeoff | text | Honest Trade-off |
| best_for | text | Best For |
| sources | text | Raw source citations |
| created_at | timestamptz | default now() |
| updated_at | timestamptz | default now() |

- Unique constraint on `(city, neighborhood)`
- RLS: public read (anonymous OK — this is editorial content), admin write
- Updated_at trigger reusing existing `update_updated_at_column()`

### Data Import

**Edge function: `import-neighborhood-profiles`**
- Accepts JSON array of `{ city, neighborhood, reputation, physical_character, ... }` objects
- Upserts into `neighborhood_profiles` on `(city, neighborhood)` conflict
- Admin-only (check auth)

**Frontend admin page** at `/admin/import-neighborhood-profiles`:
- Parses the Excel/CSV client-side, maps columns to the 8 fields + sources
- Sends batches to the edge function
- Shows progress and results

### Data Hook

**`useNeighborhoodProfile(city, neighborhood)`**
- Simple query: `supabase.from('neighborhood_profiles').select('*').eq('city', city).eq('neighborhood', neighborhood).maybeSingle()`
- Stale time: 10 minutes (editorial data, rarely changes)

### Neighborhood Context Card Component

**`NeighborhoodContextCard`** — collapsible card shown on property detail pages when a profile exists for that neighborhood.

Displays the 8 data fields in an organized layout:
- **Header**: "{Neighborhood}, {City}" with a subtle "Neighborhood Guide" label
- **Sections** as expandable accordions or compact paragraphs:
  - Reputation & Positioning
  - Physical Character
  - Proximity Anchors
  - Anglo/International Community
  - Daily Life Infrastructure
  - Transit & Mobility
  - Honest Trade-off (highlighted with a subtle warning icon)
  - Best For (highlighted as a summary callout)
- **Sources** collapsed at bottom with linked citations
- If no profile exists for this neighborhood, the card doesn't render

### Integration Points

1. **PropertyDetail.tsx** — Add `NeighborhoodContextCard` after Location section (before Questions to Ask), wrapped in `MobileCollapsibleSection` with `alwaysStartClosed`
2. **Project detail pages** — Same pattern (pass city + neighborhood)
3. **Rental pages** — Same pattern (already uses same PropertyDetail page for rentals)

### Implementation Order

1. Create `neighborhood_profiles` table via migration
2. Create import edge function
3. Build admin import page + parse the Excel data into JSON
4. Create `useNeighborhoodProfile` hook
5. Build `NeighborhoodContextCard` component
6. Wire into PropertyDetail.tsx

