

## Paginated Neighborhood Explorer with Arrow Navigation

### Changes to `src/components/city/CityNeighborhoods.tsx`

Replace the current "show 8 + Show All" pattern with a paginated card view:

**Header row redesign:**
```text
📍 Neighborhoods in Tel Aviv (23)      ◀  1/4  ▶     🔍
```
- Left: MapPin icon + title + count
- Center-right: Left/right arrow buttons (ChevronLeft/ChevronRight) with "1/4" page indicator between them
- Right: Search icon that expands into an input on click (or a compact always-visible input on desktop)

**Pagination logic:**
- `PAGE_SIZE = 6` (3 rows of 2 cards)
- `currentPage` state, starts at 0
- When search is active: no pagination, show all filtered results (up to ~6, or all matches)
- When search is empty: show `neighborhoods.slice(page * 6, page * 6 + 6)`
- Total pages = `Math.ceil(neighborhoods.length / 6)`
- Arrow buttons disabled at first/last page, subtle opacity change
- Page 1 = featured/international-relevant neighborhoods (already sorted this way from AreaDetail data merge)

**Search behavior:**
- Compact search input (same as current but slightly smaller)
- When user types, pagination disappears, filtered results show inline (all matches visible)
- When search is cleared, back to paginated view at page 1

**Card design:** Keep existing `NeighborhoodCard` as-is — it already matches brand standards (primary/10 badges, semantic-green/destructive trends, muted backgrounds, border-l accent for featured).

**Remove:**
- `showAll` state and "Show all X neighborhoods" button
- `INITIAL_SHOW` constant

**Add:**
- `currentPage` state (number, default 0)
- `totalPages` computed from filtered length
- Pagination arrows in header using `Button variant="ghost" size="icon"`
- Page indicator text "1/4" styled `text-xs text-muted-foreground tabular-nums`

**Source note:** Keep as-is at bottom.

### No changes to `AreaDetail.tsx`
Data merging and component placement stay the same.

### Brand compliance
- Arrow buttons: `variant="ghost"` with `text-primary` on hover, `disabled:opacity-30`
- Page indicator: `text-muted-foreground` neutral
- No new colors introduced — all existing design tokens

