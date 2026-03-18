

## Consolidate Project Filter Bar

### What Changes

**1. Move 3 filters into the "More Filters" sheet:**
- **Neighborhood** — add at the top of the More Filters sheet (location context, right after opening)
- **Status** — add as "Construction Stage" section (it's the same data as the existing `construction_stage` multi-select already in More Filters — we'll merge them into one, using the Status single-select UI but keeping multi-select)
- **Developer** — add with search input, after Construction Stage

**2. Remove their standalone popover buttons** from the top-level bar (lines 318-370 for Neighborhood, 384-437 for Status, 685-761 for Developer).

**3. Move Sort + Create Alert inline** with the filter buttons — remove the `ml-auto` wrapper div and place the Sort popover and Create Alert button directly in the same `flex-wrap` row as City, Beds/Baths, Price, Completion, More.

**4. Update the "More Filters" badge count** to include neighborhood, status/construction_stage, and developer_id.

**5. Update the reset button** in the More Filters sheet to also clear neighborhood, status, and developer_id.

### Resulting top-level filter row
```text
[City] [Beds/Baths] [Price] [Completion] [More] [Clear]  ⇅ Newest First ▾  [🔔 Create Alert]
```

### More Filters sheet order (top to bottom)
1. **Neighborhood** (with NeighborhoodSelector, scoped to selected city)
2. **Construction Stage** (merged Status + Construction Stage — multi-select 2×3 grid)
3. **Developer** (searchable list with verified badges)
4. **Size (m²)**
5. **Amenities**
6. **Parking**
7. **Property Types**

### Files Modified
- `src/components/filters/ProjectFilters.tsx` — all changes in this single file

