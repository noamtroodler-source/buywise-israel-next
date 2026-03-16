

## Plan: Make Neighborhood Mapping Data User-Facing Ready

### Current State
- **CBS data exists** in `neighborhood_price_history` table (Hebrew neighborhood names, price data by room count/quarter/year)
- **AI mappings were generated** (~249 mappings linking Anglo names ↔ CBS IDs) but are **ephemeral** — only returned as JSON, not persisted
- **User-facing neighborhood cards** (`CityNeighborhoodHighlights`) show only manually curated vibes/descriptions from `cities.featured_neighborhoods` JSON — no real price data
- **No connection** between CBS price data and user-facing neighborhood displays

### What Needs to Happen

#### 1. Create `neighborhood_cbs_mappings` table
Persist the AI-generated mappings so they're deterministic and reviewable.

```text
neighborhood_cbs_mappings
├── id (uuid, PK)
├── city (text)              -- CBS city name
├── anglo_name (text)        -- Platform neighborhood name
├── cbs_neighborhood_id (text) -- CBS ID for joining price data
├── cbs_hebrew (text)        -- CBS Hebrew name
├── confidence (text)        -- exact/high/likely/none
├── status (text)            -- approved/pending/rejected (default: pending)
├── notes (text)
├── created_at, updated_at
└── UNIQUE(city, anglo_name)
```

RLS: read access for all authenticated users; write access for admins only.

#### 2. Update edge function to persist mappings
Modify `map-neighborhoods` to upsert results into the new table after AI processing, with `status = 'pending'` by default.

#### 3. Add admin review UI to MapNeighborhoods page
- Add approve/reject buttons per mapping row
- Bulk approve all "exact" and "high" confidence mappings
- Filter by status (pending/approved/rejected)
- Show count of approved vs pending

#### 4. Create `useNeighborhoodPrices` hook
Query `neighborhood_cbs_mappings` (where status = 'approved') joined with `neighborhood_price_history` to get real price data for a given city's neighborhoods. Returns avg price, YoY change, and latest quarter data per Anglo neighborhood name.

#### 5. Enrich user-facing neighborhood cards with real prices
Update `CityNeighborhoodHighlights` and `FeaturedNeighborhood` type to optionally display:
- Average price (latest quarter)
- YoY price change percentage
- Price per sqm trend indicator (up/down/stable)

The card will show the curated vibe/description alongside real CBS-sourced numbers. If no approved mapping exists for a neighborhood, it gracefully shows the card without price data.

#### 6. Add neighborhood price context to property detail pages
On `PropertyQuickSummary` or `MarketIntelligence`, if the property's neighborhood has an approved CBS mapping, show a small "Neighborhood avg: ₪X.XM" context line so buyers can compare the listing price to the neighborhood average.

### File Changes

| File | Change |
|------|--------|
| **DB migration** | Create `neighborhood_cbs_mappings` table with RLS |
| `supabase/functions/map-neighborhoods/index.ts` | Upsert mappings into new table |
| `src/pages/admin/MapNeighborhoods.tsx` | Add approve/reject UI, load from DB instead of just edge function output |
| `src/types/neighborhood.ts` | Add optional price fields to `FeaturedNeighborhood` |
| `src/hooks/useNeighborhoodPrices.ts` | New hook: fetch approved mappings + price data |
| `src/hooks/useCityNeighborhoods.tsx` | Merge curated data with CBS price data |
| `src/components/city/CityNeighborhoodHighlights.tsx` | Show price data on cards |
| `src/components/property/PropertyQuickSummary.tsx` | Add neighborhood avg price context |

