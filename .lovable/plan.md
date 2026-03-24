

# Curate 16 Featured Listings with Full Paid-Feature Benefits

## Summary
Select the 8 best sale and 8 best rental listings, then activate them across **all three** featured systems — exactly as if each agency had paid ₪299/mo per listing.

## What "Fully Featured" Means

There are three independent systems that a paid featured listing activates. All 16 picks will be inserted into each:

| System | Table | What It Does |
|---|---|---|
| **Homepage display** | `homepage_featured_slots` | Shows in "For Sale" / "For Rent" tabs on homepage |
| **Search boost** | `featured_listings` | Appears first on search results (page 1 priority), excluded from organic to prevent dupes, shows "Promoted" badge |
| **Map/card badge** | `properties.is_featured = true` | Shows ⭐ "Featured" badge on map popups, overlays, and listing cards |

Plus the `snapshot_featured_performance` trigger will automatically capture baseline metrics for performance tracking.

## Selection Criteria

**For Sale (8 picks):**
- Primary: listing price/sqm closest to `sold_transactions` city average (market intelligence alignment)
- Secondary: has images, has neighborhood, bedrooms > 0, has address
- Diversity: max 3 per agency, mix of cities and price points

**For Rent (8 picks):**
- Best data completeness (images, address, bedrooms, features)
- Diversity across neighborhoods and price points

## Implementation — One-Shot Edge Function: `curate-featured-homepage`

1. Clear any existing `homepage_featured_slots` for property types and deactivate any existing `featured_listings`
2. Query all published sale listings, score by market price alignment + completeness
3. Pick top 8 sale, top 8 rent with diversity caps
4. For each of the 16 picks:
   - `INSERT INTO homepage_featured_slots` (with `slot_type` and `position`)
   - `INSERT INTO featured_listings` (`agency_id`, `property_id`, `is_active = true`, `is_free_credit = true`)
   - `UPDATE properties SET is_featured = true WHERE id = ...`

## Files
1. **New**: `supabase/functions/curate-featured-homepage/index.ts` — one-shot function
2. No frontend changes needed

## Execution
Deploy, invoke once, verify homepage + search results + map badges all show the 16 listings, delete function.

