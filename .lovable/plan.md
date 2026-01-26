

# Vary Mock Listing Dates for Realistic Freshness Display

## The Problem
All 800 mock properties were created at the same time, so they all show the same "days on market" badge. This doesn't look realistic for the demo.

## Current Freshness Tiers
The app already has a tiered system based on `created_at`:

| Tier | Days | Badge Display |
|------|------|---------------|
| **Hot** | 0-3 days | 🔥 "Just Listed" / "Just Available" (amber) |
| **Fresh** | 4-7 days | ✨ "New" (blue) |
| **Standard** | 8-30 days | Muted text "Listed X days ago" |
| **Stale** | 30+ days | No badge (older listing) |

## The Fix
Update all 800 properties with varied `created_at` dates to distribute them across all tiers:

### Distribution Plan
- **~15% Hot** (0-3 days ago) - ~120 listings
- **~20% Fresh** (4-7 days ago) - ~160 listings  
- **~40% Standard** (8-30 days ago) - ~320 listings
- **~25% Older** (31-90 days ago) - ~200 listings

## Technical Implementation

Run a SQL UPDATE that randomizes the `created_at` timestamps:

```sql
UPDATE properties 
SET created_at = NOW() - (
  CASE 
    -- 15% Hot: 0-3 days
    WHEN random() < 0.15 THEN (random() * 3)::int * interval '1 day'
    -- 20% Fresh: 4-7 days  
    WHEN random() < 0.35 THEN (4 + random() * 3)::int * interval '1 day'
    -- 40% Standard: 8-30 days
    WHEN random() < 0.75 THEN (8 + random() * 22)::int * interval '1 day'
    -- 25% Older: 31-90 days
    ELSE (31 + random() * 59)::int * interval '1 day'
  END
),
updated_at = NOW()
WHERE is_published = true;
```

Also update projects with similar distribution:
```sql
UPDATE projects 
SET created_at = NOW() - (
  CASE 
    WHEN random() < 0.15 THEN (random() * 3)::int * interval '1 day'
    WHEN random() < 0.35 THEN (4 + random() * 3)::int * interval '1 day'
    WHEN random() < 0.75 THEN (8 + random() * 22)::int * interval '1 day'
    ELSE (31 + random() * 59)::int * interval '1 day'
  END
),
updated_at = NOW()
WHERE is_published = true;
```

## Result
After running this update:
- Property cards will show a mix of "Just Listed", "New", and regular date labels
- The listings page will look like an active marketplace with varied inventory ages
- Featured sections will have a realistic mix of new and established listings

