

## Completion Year Range Filter (Two-Tap Pills)

### What Changes

Replace the single-year completion filter with a **two-tap range selection**. Users tap one year for "from", tap another for "to", and everything in between highlights. Tapping the same year twice = single year. Works on both desktop popover and mobile filter sheet.

### How It Works

1. **First tap** -- selects the "from" year (highlighted as primary)
2. **Second tap** -- selects the "to" year (highlighted as primary, years between get a subtle bg)
3. **Same year tapped twice** -- clears back to no selection
4. **Tapping a third time** -- resets and starts fresh with new "from"
5. If "to" is before "from", they auto-swap

### Filter Chip Display

- No selection: "Completion"
- Single year: "2027"
- Range: "2027 – 2029"

### Technical Details

**1. Update `ProjectFiltersType`** (`src/components/filters/ProjectFilters.tsx`)

Replace `completion_year?: number` with:
```
completion_year_from?: number;
completion_year_to?: number;
```

**2. Update Desktop Popover** (`src/components/filters/ProjectFilters.tsx`)

- Add a small "From -- To" hint label above the year grid
- Year pill styling:
  - **From/To year**: `bg-primary text-primary-foreground`
  - **In-between years**: `bg-primary/15 text-primary border-primary/30`
  - **Unselected**: default border style
- Click logic: first click sets `from`, second click sets `to` (auto-swap if needed), third click resets
- Filter button label shows range or single year
- Clear button resets both values

**3. Update Mobile Filter Sheet** (`src/components/filters/ProjectMobileFilterSheet.tsx`)

- Same two-tap logic and pill styling as desktop
- "Any" pill clears both from/to

**4. Update All Query Hooks** (3 files)

In `useProjects.tsx`, `usePaginatedProjects.tsx`, and the `applyFilters` function:

Replace the single-year date filter:
```ts
// Old
if (filters.completion_year) {
  query = query.gte('completion_date', `${filters.completion_year}-01-01`)
               .lte('completion_date', `${filters.completion_year}-12-31`);
}

// New
if (filters.completion_year_from) {
  query = query.gte('completion_date', `${filters.completion_year_from}-01-01`);
}
if (filters.completion_year_to) {
  query = query.lte('completion_date', `${filters.completion_year_to}-12-31`);
}
```

**5. Update active filter counting** in both desktop and mobile to check `completion_year_from || completion_year_to` instead of `completion_year`.

### Files Modified

- `src/components/filters/ProjectFilters.tsx` -- type + desktop UI + filter logic
- `src/components/filters/ProjectMobileFilterSheet.tsx` -- mobile UI
- `src/hooks/useProjects.tsx` -- query filter
- `src/hooks/usePaginatedProjects.tsx` -- query filter
