

# Track and Display Price Increases on Listings

## Problem
The price change tracking system only handles price **drops**. When an agent raises a price (e.g., ₪5M to ₪5.5M), the system doesn't record the original price, so the listing page shows no indication that the price changed. The listing page also only displays "Price Reduced" badges, with no equivalent for increases.

Your property did save correctly at ₪5,500,000 (confirmed in the database). The ₪5M you saw on the listing page was likely a cached/stale page -- a refresh should show the updated price. But there's no indicator showing it was originally ₪5M.

## What Changes

### 1. Database trigger update
Modify the `handle_price_reduction` trigger to also store `original_price` when a price is **increased** (not just decreased). The trigger will:
- Store the old price as `original_price` on ANY price change (up or down), if not already set
- Only set `price_reduced_at` on decreases (unchanged behavior)
- Clear `original_price` only when price returns exactly to the original value

### 2. Listing page -- show "Price Increased" indicator
Update `PropertyQuickSummary` to show a badge when `original_price < price` (price went up):
- Show strikethrough original price: ~~₪5,000,000~~
- Show amber badge: "Increased ₪500,000 (10%)" with a TrendingUp icon
- This mirrors the existing green "Reduced" badge but with amber styling

### 3. Listing card -- show price increase on cards too
Update `PropertyCard` to also detect and display price increases in the card view, using the same `original_price < price` logic.

### 4. Fix the specific property
Run a one-time data fix: set `original_price = 5000000` on your property since the trigger wasn't tracking increases when the change was made.

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | Update `handle_price_reduction()` trigger to track increases |
| New migration SQL | Fix data: set `original_price` on the specific property |
| `src/components/property/PropertyQuickSummary.tsx` | Add "Price Increased" badge and strikethrough when `original_price < price` |
| `src/components/property/PropertyCard.tsx` | Add price increase detection alongside existing price drop logic |

## Technical Details

**Updated trigger logic:**
```sql
-- Track ANY price change (up or down)
IF NEW.price <> OLD.price THEN
  IF OLD.original_price IS NULL THEN
    NEW.original_price := OLD.price;
  END IF;
  IF NEW.price < OLD.price THEN
    NEW.price_reduced_at := NOW();
  END IF;
END IF;
-- Clear when price returns to original
IF NEW.original_price IS NOT NULL AND NEW.price = NEW.original_price THEN
  NEW.original_price := NULL;
  NEW.price_reduced_at := NULL;
END IF;
```

**UI indicator logic (PropertyQuickSummary):**
- `original_price > price` = Price Drop (green, TrendingDown) -- existing behavior
- `original_price < price` = Price Increase (amber, TrendingUp) -- new behavior
- Shows: "Increased ₪500,000 (10%)" with the original price struck through
