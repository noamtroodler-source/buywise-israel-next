

# Refresh Mock Listing Dates & Price Tags for Demo

## What This Does
A single SQL migration that updates existing mock properties to showcase all the visual tags/badges on the site: "Just Listed", "New", "Price Reduced", "Price Increased", and standard older listings.

## How Badges Work (for context)
- **"Just Listed" (hot)**: `created_at` within last 3 days
- **"New" (fresh)**: `created_at` within last 14 days
- **Standard**: 15–60 days old
- **Stale**: 60+ days old
- **"Price Reduced"**: `original_price` set higher than `price`, with `price_reduced_at` timestamp
- **"Price Increased"**: `original_price` set lower than `price`

## SQL Migration Plan

One migration that:

1. **Stagger `created_at` dates across all properties**:
   - ~10% → 0–3 days ago (triggers "Just Listed" badge)
   - ~15% → 4–14 days ago (triggers "New" badge)
   - ~50% → 15–90 days ago (standard)
   - ~25% → 90–365 days ago (older listings)

2. **Set price reduction on ~15% of properties**:
   - Set `original_price` = `price` + 3–8% markup
   - Set `price_reduced_at` = random date within last 30 days

3. **Set price increase on ~8% of properties** (non-overlapping):
   - Set `original_price` = `price` - 3–6% (so current price is higher)
   - Set `price_reduced_at` to null (increase badge uses different logic)

4. **Clear price fields on remaining ~77%** to reset any stale demo data

Uses random selection with `ORDER BY RANDOM()` and `LIMIT` to pick subsets, ensuring no overlap between price-up and price-down groups.

