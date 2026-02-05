

# Add Neighborhood Data to Properties

## Current State

The neighborhood display code is **already implemented** across all property cards and detail pages:
- PropertyCard (compact & standard): `{property.neighborhood ? `${property.neighborhood}, ` : ''}{property.city}`
- MapPropertyCard: Same format
- PropertyQuickSummary: Shows neighborhood in location line

**The Problem**: No properties have neighborhoods assigned - all 3,100+ properties have `neighborhood = NULL`.

## Solution

Populate neighborhoods on mock properties using the neighborhood data already defined in the `cities` table.

```text
Before:
┌─────────────────────────────────────┐
│ Ra'anana                            │  <- Just city
└─────────────────────────────────────┘

After:
┌─────────────────────────────────────┐
│ Neve Oz, Ra'anana                   │  <- Neighborhood + City
└─────────────────────────────────────┘
```

## Implementation

### Database Migration

Create a migration that:
1. For each city that has neighborhoods defined, randomly assign neighborhoods to ~70% of properties in that city
2. Leave ~30% without neighborhoods (realistic - not all listings specify this)

```sql
-- Assign random neighborhoods to properties based on their city
WITH city_neighborhoods AS (
  SELECT 
    name as city_name,
    jsonb_array_elements_text(
      jsonb_path_query_array(neighborhoods, '$[*].name')
    ) as neighborhood_name,
    random() as rand_order
  FROM cities
  WHERE neighborhoods IS NOT NULL 
    AND jsonb_array_length(neighborhoods) > 0
),
-- Get one random neighborhood per city for each property
property_assignments AS (
  SELECT DISTINCT ON (p.id)
    p.id as property_id,
    cn.neighborhood_name
  FROM properties p
  JOIN city_neighborhoods cn ON cn.city_name = p.city
  WHERE p.neighborhood IS NULL
    AND random() < 0.7  -- 70% of properties get a neighborhood
  ORDER BY p.id, random()
)
UPDATE properties p
SET neighborhood = pa.neighborhood_name
FROM property_assignments pa
WHERE p.id = pa.property_id;
```

## Expected Result

- ~2,170 properties (70%) will have neighborhoods assigned
- ~930 properties (30%) will remain without (realistic variation)
- All existing UI will immediately show neighborhoods without code changes

## Files Changed

| File | Change |
|------|--------|
| Database Migration | SQL to populate neighborhood field on properties |

## Benefits

- **Immediate visibility**: Neighborhoods appear on all cards and detail pages
- **No code changes needed**: Display logic already exists
- **Realistic data**: Random assignment from actual city neighborhoods
- **User trust**: Shows local knowledge ("Neve Oz, Ra'anana" vs just "Ra'anana")

