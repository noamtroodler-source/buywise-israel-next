

# Price Drop Indicator -- Full Implementation

## What You'll Get
When an agent (or developer) lowers a listing's price, the system will automatically track the original price and show a prominent "Price Reduced" indicator across the entire site -- on listing cards, detail pages, map markers, and in search filters/sorting.

---

## 1. Database Trigger (auto-track price changes)

Create a Postgres trigger on the `properties` table so that when `price` is updated to a lower value, the system automatically:
- Sets `original_price` to the previous price (only if not already set)
- Sets `price_reduced_at` to the current timestamp

This means agents don't need to do anything special -- they just lower the price and the system handles the rest. Both columns already exist in the database.

---

## 2. Add "Price Drops" Sort Option

Add a new sort option across all listing views:
- **Type definition**: Add `'price_drop'` to the `SortOption` type in `src/types/database.ts`
- **Sort dropdown**: Add "Price Drops First" to `SORT_OPTIONS` arrays in:
  - `src/components/filters/PropertyFilters.tsx`
  - `src/components/map-search/MapPropertyList.tsx`
- **Query logic**: In `src/hooks/useProperties.tsx`, handle the `price_drop` sort by ordering properties with `original_price IS NOT NULL` first, then by `price_reduced_at` descending (most recent drops first)

---

## 3. Property Detail Page -- Price Drop Badge

Update `PropertyQuickSummary` to display price drop info:
- Add `original_price` and `price_reduced_at` to its prop interface
- Show a strikethrough original price next to the current price
- Display a green/primary badge: "Reduced ₪50,000 (5%)" with the reduction amount and percentage
- If `price_reduced_at` exists, show relative date: "Price reduced 3 days ago"

---

## 4. Enhance PropertyCard Badge

The card already shows a strikethrough price, but enhance it with:
- A small "Price Drop" badge on the image overlay (similar to the "New" badge) showing the drop percentage
- Use a distinct color (green or primary) so it catches the eye in grid view

---

## 5. Files Changed

| File | Change |
|------|--------|
| `src/types/database.ts` | Add `'price_drop'` to `SortOption` union |
| `src/hooks/useProperties.tsx` | Add `price_drop` sort case in both `useProperties` and `usePropertyCount` |
| `src/components/filters/PropertyFilters.tsx` | Add sort option to `SORT_OPTIONS` array |
| `src/components/map-search/MapPropertyList.tsx` | Add sort option to `SORT_OPTIONS` array |
| `src/components/property/PropertyQuickSummary.tsx` | Add `original_price` + `price_reduced_at` to interface; render price drop badge |
| `src/components/property/PropertyCard.tsx` | Add "Price Drop" badge on image overlay |
| Database migration | Trigger function `handle_price_reduction` on `properties` UPDATE |

---

## Technical: DB Trigger SQL

```sql
CREATE OR REPLACE FUNCTION handle_price_reduction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price < OLD.price THEN
    -- Only set original_price if not already tracking a drop
    IF OLD.original_price IS NULL THEN
      NEW.original_price := OLD.price;
    END IF;
    NEW.price_reduced_at := NOW();
  END IF;
  -- If price goes back up to or above original, clear the drop
  IF NEW.original_price IS NOT NULL AND NEW.price >= NEW.original_price THEN
    NEW.original_price := NULL;
    NEW.price_reduced_at := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_price_reduction
  BEFORE UPDATE ON properties
  FOR EACH ROW
  WHEN (OLD.price IS DISTINCT FROM NEW.price)
  EXECUTE FUNCTION handle_price_reduction();
```

