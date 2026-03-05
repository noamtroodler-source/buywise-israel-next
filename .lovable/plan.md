

# Show Exactly 3 Items at a Time

The current `max-h-[84px]` is already close but may not perfectly fit 3 rows. Each row uses `py-1.5` (12px padding) + `text-sm` (~20px line height) = ~32px per row. 3 rows × 32px = **96px**.

### Changes

**1. `src/components/filters/NeighborhoodSelector.tsx` (line 54)**
- Change `max-h-[84px]` → `max-h-[96px]`

**2. `src/components/filters/PropertyFilters.tsx`**
- Change the city list `max-h-[84px]` → `max-h-[96px]`

**3. `src/components/filters/MobileFilterSheet.tsx`**
- Same `max-h` update for both neighborhoods and cities lists

All three lists remain scrollable for additional items.

