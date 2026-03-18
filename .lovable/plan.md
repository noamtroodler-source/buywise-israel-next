

## Featured Listings Performance Tracking

### What we're building

A `featured_performance` table that snapshots metrics for each featured listing at the time it's featured, then lets us compute the **lift** (extra views, saves, inquiries) that featuring provided. This feeds into both the admin dashboard and the agency-facing featured management page.

### Database

**New table: `featured_performance`**

| Column | Type | Purpose |
|---|---|---|
| id | uuid PK | |
| featured_listing_id | uuid FK → featured_listings.id | Links to the featured record |
| property_id | uuid FK → properties.id | For easy joins |
| agency_id | uuid | Owner agency |
| snapshot_views | int | `views_count` at time of featuring |
| snapshot_saves | int | `total_saves` at time of featuring |
| snapshot_inquiries | int | Inquiry count at time of featuring |
| current_views | int | Latest `views_count` (updated periodically or on-read) |
| current_saves | int | Latest `total_saves` |
| current_inquiries | int | Latest inquiry count |
| featured_at | timestamptz | When featuring started |
| unfeatured_at | timestamptz | When featuring ended (null if active) |
| created_at | timestamptz | |

**Approach**: Rather than continuously updating `current_*` columns, we'll compute lift on-read by comparing the property's current `views_count`/`total_saves` and inquiry count against the snapshot values. This avoids extra writes and keeps it simple.

So the actual table is slim:

| Column | Type |
|---|---|
| id | uuid PK |
| featured_listing_id | uuid FK UNIQUE |
| property_id | uuid |
| agency_id | uuid |
| snapshot_views | int default 0 |
| snapshot_saves | int default 0 |
| snapshot_inquiries | int default 0 |
| featured_at | timestamptz |
| created_at | timestamptz |

**DB trigger**: On `featured_listings` INSERT (when a listing becomes featured), auto-create a `featured_performance` row with the property's current `views_count`, `total_saves`, and inquiry count as the snapshot.

### Code Changes

**1. New hook: `src/hooks/useFeaturedPerformance.tsx`**

- `useFeaturedPerformanceAdmin()` — fetches all active featured listings joined with their snapshots and current property stats, computes lift (views gained, saves gained, inquiries gained while featured)
- `useFeaturedPerformanceSummary()` — aggregate totals for the admin dashboard card

**2. Admin Dashboard (`AdminDashboard.tsx`)**

- Add a new stat card: "Featured Listings" showing active count + total lift metrics
- Or a small "Featured Performance" summary card showing:
  - Active featured count
  - Total extra views generated
  - Total extra saves generated  
  - Total extra inquiries generated

**3. Admin Featured page (`AdminFeatured.tsx`)**

- Add performance badges to each `FeaturedPropertyCard` showing views/saves/inquiries gained since featuring
- Small inline metrics like "+42 views, +3 saves, +1 inquiry"

**4. Snapshot creation**

- DB trigger on `featured_listings` INSERT captures the baseline automatically
- For existing active featured listings, we'll backfill snapshots with current values (meaning lift starts from now for those)

### Summary

- 1 new table + 1 trigger (migration)
- 1 new hook for performance data
- Update AdminDashboard with a featured performance card
- Update AdminFeatured page with per-listing lift metrics

