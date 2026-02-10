

# Seed Mock Price Drop Data

## Current State
All the UI components are already built and ready:
- **PropertyQuickSummary** (detail page): Shows strikethrough original price + "Reduced X (Y%)" badge + "Price reduced N days ago"
- **PropertyCard** (grid/list): Shows "Price Drop" badge on image + strikethrough price
- **MapPropertyCard** (map sidebar): Shows strikethrough price
- **PropertyMarker** (map pins): Shows down-arrow indicator on markers
- **Sort option**: "Price Drops First" already exists in filter dropdowns

The problem: zero properties have `original_price` or `price_reduced_at` set, so none of this shows up.

## What This Migration Does

Run a single SQL migration that directly sets `original_price` and `price_reduced_at` on a realistic subset of existing mock listings:

**For Sale properties (~150 listings, ~10% of 1,554)**
- Spread across multiple cities (Tel Aviv, Jerusalem, Herzliya, Netanya, Haifa, etc.)
- Realistic reduction amounts: 3-8% (typical Israeli market drops)
- Varied timing: some reduced today, some 2 days ago, some 1-2 weeks ago, some a month ago

**For Rent properties (~50 listings, ~3% of 1,554)**
- Smaller absolute drops (rental reductions are more modest)
- Reduction amounts: 3-10% of monthly rent
- Recent timing (rentals adjust faster)

**Projects (~3-5 projects)**
- Set `original_price_from` and `price_reduced_at` on a few projects

## Technical Details

**Single migration file** with SQL like:

```sql
-- Seed ~150 for_sale properties with price drops (3-8% reduction)
UPDATE properties
SET 
  original_price = price + ROUND(price * (0.03 + RANDOM() * 0.05)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 30) || ' days')::interval
WHERE id IN (
  SELECT id FROM properties 
  WHERE listing_status = 'for_sale' 
    AND original_price IS NULL
  ORDER BY RANDOM() 
  LIMIT 150
);

-- Seed ~50 for_rent properties with price drops
UPDATE properties
SET
  original_price = price + ROUND(price * (0.03 + RANDOM() * 0.10)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 14) || ' days')::interval
WHERE id IN (
  SELECT id FROM properties 
  WHERE listing_status = 'for_rent' 
    AND original_price IS NULL
  ORDER BY RANDOM() 
  LIMIT 50
);

-- Seed 3 projects with price drops
UPDATE projects
SET
  original_price_from = price_from + ROUND(price_from * (0.03 + RANDOM() * 0.05)),
  price_reduced_at = NOW() - (FLOOR(RANDOM() * 21) || ' days')::interval
WHERE id IN (
  SELECT id FROM projects
  WHERE original_price_from IS NULL
    AND price_from IS NOT NULL
  ORDER BY RANDOM()
  LIMIT 3
);
```

This uses `RANDOM()` so each property gets a unique, realistic drop percentage and date.

## Files Changed

| File | Change |
|------|--------|
| Database migration (new) | Seed `original_price` + `price_reduced_at` on ~200 properties and ~3 projects |

No code changes needed -- all UI components already handle these fields.

## After This

You'll immediately see:
- "Price Drop" badges on listing cards in search results
- Down-arrow indicators on map markers
- Strikethrough prices with "Reduced" badges on detail pages
- "Price Drops First" sort actually returning results

