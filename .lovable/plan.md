

# Reorder Location Filter: Neighborhoods First, Then Cities

## What to Change

When a city is selected, reorder the Location popover so **Neighborhoods** appear above the city list, and change the search placeholder from "Search city..." to "Search...".

The search input should filter both neighborhoods and cities simultaneously.

### Files to Modify

**1. `src/components/filters/PropertyFilters.tsx`**
- Change placeholder from `"Search city..."` to `"Search..."`
- Move the `<NeighborhoodSelector>` block (currently at line 540) to render **before** the cities list (before the `<div className="max-h-[150px]">` at line 513)
- Add the "City" label only when a city is selected (since neighborhoods now come first)
- Keep the current `filteredCities` logic intact — neighborhoods are already filtered separately inside `NeighborhoodSelector`

**2. `src/components/filters/NeighborhoodSelector.tsx`**
- Accept an optional `externalSearch` prop so the parent's single search input can filter neighborhoods too (rather than having a second search box inside)
- When `externalSearch` is provided, hide the internal search input and use the external value for filtering

**3. `src/components/filters/MobileFilterSheet.tsx`**
- Same changes: placeholder → `"Search..."`, neighborhoods section moved above cities list

**4. `src/components/filters/ProjectFilters.tsx`** (if it has the same pattern)
- Same placeholder change for consistency

### Layout After Change (when city is selected)
```text
Location                          Clear
┌─────────────────────────────┐
│ 🔍 Search...                │
├─────────────────────────────┤
│ 📍 Use my location          │
├─────────────────────────────┤
│ Neighborhoods                │  ← moved up
│  German Colony               │
│  Katamon                     │
│  Old City                    │
│  Rehavia                     │
├─────────────────────────────┤
│ Cities                       │
│  Ashdod                      │
│  Ashkelon                    │
│  ...                         │
├─────────────────────────────┤
│ Not sure where to look? →   │
│ [Show 67 results]           │
└─────────────────────────────┘
```

