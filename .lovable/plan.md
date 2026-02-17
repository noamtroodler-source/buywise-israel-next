
# Phase D: Visibility Product Corrections

## Overview
Add a `sort_order` column to `visibility_products`, insert missing boost products, split the existing "Homepage Project Featured" into hero vs. secondary tiers, and update credit costs to match spec values.

## Database Migration

A single migration will:

### 1. Add `sort_order` column
```sql
ALTER TABLE public.visibility_products ADD COLUMN sort_order integer DEFAULT 0;
```

### 2. Split "Homepage Project Featured"
- Update the existing `homepage_project_featured` row to become the **hero** slot: rename to "Homepage Project Hero", slug `homepage_project_hero`, 150 credits, max_slots = 1
- Insert a new **secondary** slot: "Homepage Project Secondary", slug `homepage_project_secondary`, 90 credits, max_slots = 2, applies_to = 'developer'

### 3. Insert new products
- **Projects Boost**: slug `projects_boost`, 60 credits, 7 days, applies_to = 'developer', description "Top of /projects grid"
- **Budget Tool Sponsor**: slug `budget_tool_sponsor`, 50 credits, 7 days, applies_to = 'all', description "Sponsored slot in Properties in Your Budget tool"

### 4. Update existing credit costs to spec values
Adjust any existing products whose costs don't match the spec (the user's message says "update existing product credit costs to match spec values" -- the current values will be preserved unless they explicitly differ from spec; the main change is the homepage project split above).

### 5. Set sort_order on all products
Assign a logical display order to all products (1-11).

## Final Product Lineup (after migration)

| # | Slug | Name | Credits | Days | Slots | Applies To |
|---|------|------|---------|------|-------|------------|
| 1 | homepage_sale_featured | Homepage Sale Featured | 30 | 7 | 6 | agency |
| 2 | homepage_rent_featured | Homepage Rent Featured | 25 | 7 | 6 | agency |
| 3 | homepage_project_hero | Homepage Project Hero | 150 | 7 | 1 | developer |
| 4 | homepage_project_secondary | Homepage Project Secondary | 90 | 7 | 2 | developer |
| 5 | projects_boost | Projects Boost | 60 | 7 | null | developer |
| 6 | search_priority | Search Priority Boost | 15 | 7 | null | all |
| 7 | city_spotlight | City Spotlight | 20 | 7 | 3 | all |
| 8 | budget_tool_sponsor | Budget Tool Sponsor | 50 | 7 | 1 | all |
| 9 | similar_listings_priority | Similar Listings Priority | 10 | 7 | null | all |
| 10 | agency_directory_featured | Agency Directory Featured | 25 | 30 | 5 | agency |
| 11 | developer_directory_featured | Developer Directory Featured | 25 | 30 | 5 | developer |
| 12 | email_digest_sponsored | Email Digest Sponsored | 35 | 7 | 2 | all |

## Frontend: Sort by `sort_order`
Update `src/hooks/useBoosts.ts` to order by `sort_order` instead of `credit_cost` so products display in the intended order.

## Technical Details

### Files Modified
- `src/hooks/useBoosts.ts` -- change `.order('credit_cost', ...)` to `.order('sort_order', ...)`

### Database Migration (single SQL file)
1. `ALTER TABLE` to add `sort_order`
2. `UPDATE` existing `homepage_project_featured` to become hero variant
3. `INSERT` three new products (secondary, projects_boost, budget_tool_sponsor)
4. `UPDATE` all rows to set `sort_order` values

No other code changes needed -- the BoostDialog and admin pages already render whatever products exist.
