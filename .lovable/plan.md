

## Redesign: Neighborhood Price Table → Compact Inline + Drawer

### Problem
The full sortable table is overwhelming and breaks the curated page feel. But removing it loses the "explore/search" value for buyers looking up specific neighborhoods.

### Solution: Two-layer approach

**Layer 1 — Inline "Price Snapshot" strip** (always visible, tiny footprint)
- A single compact row below Neighborhood Highlights showing:
  - "X neighborhoods tracked" count
  - Price range: "₪1.2M – ₪6.5M"  
  - Top riser: "Neve Tzedek +8.2%"
- Plus a "Browse all neighborhoods" button that opens Layer 2
- Fits in ~60px of vertical space — less than a single table row

**Layer 2 — Bottom drawer with searchable table** (on demand)
- Uses the existing vaul `Drawer` component (already installed)
- Contains: search input at top + the full sortable table inside the drawer
- Search filters rows by name as you type
- Drawer snaps to ~70vh so it feels like a native mobile sheet
- Desktop: same drawer works fine, or could use Sheet from right — drawer is simpler and consistent

### What changes

**`CityNeighborhoodPriceTable.tsx`** — Complete rewrite:
- Rename the exported component (keep same file)
- New inline strip: uses `useNeighborhoodPriceTable` data to compute range + top riser
- "Browse all" button triggers Drawer open state
- Inside Drawer: search Input + the existing table markup (moved into drawer body)
- Table gets a search filter: `rows.filter(r => r.name.toLowerCase().includes(query))`

**`AreaDetail.tsx`** — Move the section lower (after Price by Apartment Size, before Worth Watching) to sit in the "data-heavy" zone where users expect numbers

### Inline strip design
```text
┌─────────────────────────────────────────────────────┐
│ 📊 32 neighborhoods · ₪890K – ₪6.5M · Top: Neve   │
│    Tzedek +8.2%                 [Browse all →]      │
└─────────────────────────────────────────────────────┘
```

### Drawer interior
- Sticky search bar at top: "Search neighborhoods..."
- Below: the existing sortable table (columns: Name, Avg Price, YoY, Tier)
- Footer: "Source: CBS" attribution
- No changes to sort logic or data hook

### Files to edit
1. **`src/components/city/CityNeighborhoodPriceTable.tsx`** — Rewrite to inline strip + drawer pattern
2. **`src/pages/AreaDetail.tsx`** — Move section placement lower (after Price by Apartment Size)

### The screenshot issue
The uploaded screenshot shows the neighborhood highlight card's price line ("Avg. ₪5.2M" with "-12%"). That's from `CityNeighborhoodHighlights` — not the table. If the concern is also about that display, clarify — but the data there looks correct (CBS-sourced avg price + YoY for featured neighborhoods).

