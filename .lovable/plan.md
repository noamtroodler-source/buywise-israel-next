

## Unified Neighborhood Explorer

### What changes

**Kill two components, build one.** Replace `CityNeighborhoodHighlights` + `CityNeighborhoodPriceTable` with a single `CityNeighborhoods` component that merges both data sources.

### Data merging (in `AreaDetail.tsx`)

Combine the featured neighborhoods (curated vibe/description) with the CBS price table rows into one unified list. Featured neighborhoods get enriched with their editorial data; CBS-only neighborhoods show just name + price + trend. Pass one merged array to the new component.

### New component: `CityNeighborhoods.tsx`

**Layout:**
- Section header: "Neighborhoods in {City}" with MapPin icon
- Search bar always visible (not hidden in drawer)
- Compact card grid: 2 cols on desktop, 1 col on mobile
- If >8 neighborhoods, show first 8 + "Show all X neighborhoods" expand button (inline, no drawer)

**Each card (compact, ~60px tall):**
```text
┌──────────────────────────────────────┐
│ Old North  שמאל הישן    Premium     │
│ "Classic Anglo-friendly, walkable"   │
│ ₪5.2M                       ↑ 3.2%  │
└──────────────────────────────────────┘
```

- **Row 1:** Name (bold) + Hebrew name (small muted) + Price tier badge (right-aligned)
- **Row 2:** 1-line vibe/description (only for featured; CBS-only rows skip this)
- **Row 3:** Price (left, bold) + YoY trend indicator (right)
- Featured neighborhoods get a subtle left border accent (`border-l-2 border-primary/30`)
- Non-featured: plain border, no description line

**Search:** Filters by name, instant. Shows "X results" count when active.

**Sorting:** Default: featured first (sorted by sort_order), then non-featured by price descending. No manual sort toggles on the cards — keep it clean. The drawer table (removed) was the only place that needed sort controls.

### Files to edit

1. **`src/components/city/CityNeighborhoods.tsx`** — New unified component
2. **`src/components/city/CityNeighborhoodHighlights.tsx`** — Delete (or leave unused)
3. **`src/components/city/CityNeighborhoodPriceTable.tsx`** — Delete (or leave unused)
4. **`src/pages/AreaDetail.tsx`** — Replace both neighborhood sections with single `<CityNeighborhoods>` call, merge data from `useCityNeighborhoods` + `useNeighborhoodPriceTable` into one unified array

### Brand compliance
- Uniform blue badges (`bg-primary/10 text-primary border-primary/20`) for price tiers
- `text-semantic-green` / `destructive` for trend indicators (existing pattern)
- `bg-muted/30` section background (matches other sections)
- No traffic-light colors on price tiers (per design philosophy)

