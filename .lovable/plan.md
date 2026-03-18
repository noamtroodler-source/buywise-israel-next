

## Featured Listings: Status-Aware Placement Fix

### The Bug

Three places fetch featured/boosted listings **without filtering by `listing_status`**, causing rentals to appear on resale pages and vice versa:

1. **`fetchFeaturedProperties()` helper** (line 10-33 in `useProperties.tsx`) — used by `useFeaturedSaleProperties`, `useFeaturedRentalProperties`, and `useCityFeaturedProperties`. Fetches ALL active `featured_listings` with **no `listing_status` filter**. This is the root cause.

2. **`usePaginatedProperties` boosted IDs** (line 74-86 in `usePaginatedProperties.tsx`) — fetches ALL `featured_listings` property IDs and prepends them to search results regardless of the current `listing_status` filter. A rental featured listing shows up on the resale search page.

3. **`useCityFeaturedProperties`** (line 485-540 in `useProperties.tsx`) — city pages show featured properties without any status filter, mixing sale and rental.

### The Fix

**1. Add `listing_status` parameter to `fetchFeaturedProperties()`**

Pass the desired status (`for_sale` | `for_rent`) and join through the `properties` table to filter:

```text
featured_listings → properties.listing_status = 'for_sale'
```

Since `featured_listings` doesn't store `listing_status`, we need to either:
- Fetch featured IDs first, then filter properties by status (current pattern, just add the `.eq('listing_status', status)` on the properties query) ← **simplest, no DB changes**

**2. Fix each caller:**

| Surface | File | Fix |
|---|---|---|
| Homepage "For Sale" tab | `useFeaturedSaleProperties` | Pass `'for_sale'` to `fetchFeaturedProperties` |
| Homepage "For Rent" tab | `useFeaturedRentalProperties` | Pass `'for_rent'` to `fetchFeaturedProperties` |
| Search/Listings page | `usePaginatedProperties` | Filter boosted properties by the current `listing_status` from filters |
| City pages | `useCityFeaturedProperties` | Accept a `listingStatus` param (default `'for_sale'` since city pages are buyer-focused), pass through |

**3. Specific code changes:**

- **`fetchFeaturedProperties()`** — add `listingStatus` param, add `.eq('listing_status', listingStatus)` to the properties query on line 28
- **`useFeaturedSaleProperties()`** — call `fetchFeaturedProperties(adminIds, 'for_sale')`
- **`useFeaturedRentalProperties()`** — call `fetchFeaturedProperties(adminIds, 'for_rent')`
- **`usePaginatedProperties`** — in the boosted properties query (line 126-140), add `.eq('listing_status', filters?.listing_status)` when fetching the actual properties. Also filter the `boostedIds` fetch or the properties fetch by status.
- **`useCityFeaturedProperties()`** — add `.eq('listing_status', 'for_sale')` to both the featured and fill queries (city market pages are buyer-focused). Optionally accept a `listingStatus` prop for future flexibility.

### No database changes needed

The `featured_listings` table doesn't need a `listing_status` column — we filter at the `properties` table level when fetching the actual property data. This is cleaner because the source of truth for a property's type stays in one place.

### Summary

All changes are in two files: `src/hooks/useProperties.tsx` and `src/hooks/usePaginatedProperties.tsx`. The fix ensures featured/boosted listings only appear on surfaces matching their `listing_status`.

