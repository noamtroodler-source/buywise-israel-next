

# Phase 5: Boost Rendering, Search Priority, and Admin Management

## Overview
Phases 2-4 built the infrastructure for subscriptions, credits, and boost activation. Phase 5 closes the loop by making active boosts **visible to end users** -- boosted listings appear in priority positions on the homepage, in search results, and in directory pages. It also adds admin tools to manage and override boosts.

## What Gets Built

### 1. Homepage Boosted Listings Integration
Properties and projects with active boosts for homepage slots (e.g., `homepage_sale_featured`, `homepage_rent_featured`, `homepage_project_featured`) should appear in the homepage carousels alongside admin-curated featured slots.

**How it works:**
- Modify `useFeaturedSaleProperties`, `useFeaturedRentalProperties`, and `useFeaturedProjects` hooks to also query `active_boosts` joined with `visibility_products` for matching slug patterns
- Boosted listings are merged with admin-featured slots, deduped, and placed at designated positions
- A subtle "Promoted" badge appears on boosted cards (distinct from admin "Featured" badge)

### 2. Search Results Priority Boost
Listings with an active `search_priority` boost appear at the top of search/listing results, before organically sorted results.

**How it works:**
- Modify `usePaginatedProperties` to first fetch property IDs with active `search_priority` boosts, then prepend them to results
- A subtle "Promoted" indicator appears on these cards in search results
- Boosted results are excluded from the organic query to prevent duplicates

### 3. City Spotlight Integration
Properties with an active `city_spotlight` boost get priority placement on city/area detail pages.

**How it works:**
- Modify `useCityFeaturedProperties` (or the area detail page query) to prepend boosted listings for that city
- Works similarly to search priority but scoped to city

### 4. Similar Listings Priority
Properties with `similar_listings_priority` boost appear first in the "Similar Properties" section on property detail pages.

**How it works:**
- Modify `useSimilarProperties` to check for active boosts and prepend matching boosted properties

### 5. Directory Featured Placement
Agencies/developers with `agency_directory_featured` or `developer_directory_featured` boosts appear at the top of their respective directory pages (/professionals, /agencies, /developers).

**How it works:**
- Modify the directory page queries to check for active boosts and prepend featured entities

### 6. Promoted Badge Component
A reusable `PromotedBadge` component that appears on boosted listings across the platform -- visually distinct from the admin "Featured" badge. Shows a small "Promoted" label with a subtle styling that complies with transparency norms.

### 7. Admin Boost Management Page
A new `/admin/boosts` page where admins can:
- View all active boosts (filterable by product type, entity)
- See boost expiration dates and slot usage
- Deactivate/cancel boosts early (with optional credit refund)
- View boost revenue analytics (total credits spent, popular products)
- Override slot limits temporarily

---

## Technical Details

### Hook Modifications for Boost Integration

**`useFeaturedSaleProperties` / `useFeaturedRentalProperties` (in `useProperties.tsx`):**
```text
After fetching admin-curated slots from homepage_featured_slots:
1. Query active_boosts WHERE target_type = 'property' 
   AND product_id matches homepage_sale_featured/homepage_rent_featured product
   AND is_active = true AND ends_at > now()
2. Fetch the boosted property details
3. Merge: admin-curated first, then boosted (deduped), up to max 8
4. Mark boosted properties with a _isBoosted flag for UI rendering
```

**`useFeaturedProjects` (in `useProjects.tsx`):**
```text
Same pattern but for homepage_project_featured product slug
```

**`usePaginatedProperties` (in `usePaginatedProperties.tsx`):**
```text
On page 1 only:
1. Query active_boosts WHERE product_id matches search_priority product
   AND target_type = 'property' AND is_active = true AND ends_at > now()
2. Fetch those properties
3. Prepend to page 1 results (mark as _isBoosted)
4. Exclude boosted IDs from the organic query to avoid duplicates
5. Adjust total count accordingly
```

### New Hook: `useBoostedListings`
A utility hook that fetches active boosts for a given product slug and returns the target entity IDs:
```text
function useBoostedListings(productSlug: string, targetType: 'property' | 'project')
  -> Returns { boostedIds: string[], isLoading: boolean }

Internally:
1. Get product ID from visibility_products by slug
2. Query active_boosts for that product_id where is_active and not expired
3. Return target_ids
```

### PromotedBadge Component
```text
src/components/shared/PromotedBadge.tsx
- Small badge: "Promoted" with a subtle gold/amber styling
- Tooltip: "This listing is promoted by its agent/developer"
- Used in PropertyCard and ProjectCard when _isBoosted is true
```

### Admin Boost Management
```text
src/pages/admin/AdminBoosts.tsx
- Table of all active_boosts joined with visibility_products and target entity names
- Columns: Boost Product, Target Listing, Entity, Started, Expires, Status
- Actions: Deactivate (sets is_active = false), Extend (update ends_at)
- Summary cards: Total active boosts, credits spent this month, most popular product
- Slot usage display per product (e.g., "Homepage Sale: 4/6 slots used")
```

### Database Changes
- New database view or RPC `get_boosted_property_ids` for efficient querying of boosted properties by product slug (optional optimization)
- No schema changes needed -- all data is already in `active_boosts` and `visibility_products`

### File Structure
```text
src/
  hooks/
    useBoostedListings.ts        -- Shared hook to fetch boosted entity IDs by product slug
  components/
    shared/
      PromotedBadge.tsx          -- "Promoted" badge for boosted listings
  pages/
    admin/
      AdminBoosts.tsx            -- Admin boost management page
```

### Modified Files
```text
src/hooks/useProperties.tsx          -- Add boost merging to featured queries
src/hooks/useProjects.tsx            -- Add boost merging to featured projects query
src/hooks/usePaginatedProperties.tsx -- Prepend search-priority boosted listings
src/components/property/PropertyCard.tsx -- Show PromotedBadge when _isBoosted
src/pages/admin/AdminLayout.tsx      -- Add "Boosts" nav item under Homepage section
src/App.tsx                          -- Add /admin/boosts route
```

### Property Type Extension
```text
Extend the Property type (or use a wrapper) to include:
  _isBoosted?: boolean  -- client-side flag, not from DB
```

### Rendering Flow (Homepage)
```text
Homepage loads
  --> FeaturedShowcase calls useFeaturedSaleProperties
  --> Hook fetches admin slots from homepage_featured_slots
  --> Hook fetches boosted IDs from active_boosts (homepage_sale_featured product)
  --> Merges: admin slots first, then boosted properties, deduped, max 8
  --> Properties with _isBoosted = true show PromotedBadge
  --> User sees a natural mix of admin-picked and agent-boosted listings
```

### Rendering Flow (Search)
```text
User searches listings
  --> usePaginatedProperties fires
  --> On page 1: fetch search_priority boosted property IDs
  --> Prepend boosted properties to organic results
  --> Boosted properties show subtle "Promoted" label
  --> Subsequent pages show only organic results
```

## What Is NOT in Phase 5
- Email digest sponsored slot rendering (requires email sending infrastructure)
- Automatic boost expiration cleanup (cron job -- can be added later)
- Boost analytics dashboard for agents/developers (can be Phase 6)
- A/B testing of boost effectiveness

