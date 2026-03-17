

## Plan: Add Anglo Hub Tags to Neighborhood Dropdown & Sort Anglo Neighborhoods First

### What Changes

**1. Update `useNeighborhoodNames` hook** (`src/hooks/useNeighborhoodNames.ts`)
- Return the city's `slug` alongside neighborhood names from the query
- For `useNeighborhoodNames(cityName)`: also fetch the `slug` column so we can pass it to the anglo tag checker
- Return objects `{ name, isAnglo }` instead of plain strings, using `isAngloNeighborhood(slug, name)` to tag each one
- Sort results: anglo-tagged neighborhoods first (alphabetical within group), then the rest alphabetical

**2. Update `NeighborhoodSelector` component** (`src/components/filters/NeighborhoodSelector.tsx`)
- Consume the new `{ name, isAnglo }` shape from the hook
- Display an "Anglo hub" badge/tag next to anglo-tagged neighborhoods (small pill, same style as on city pages)
- Maintain the anglo-first sort order in the dropdown list
- In global search mode (`useAllNeighborhoods`), also include the anglo tag

**3. Update `useAllNeighborhoods` in the same hook file**
- Extend `NeighborhoodInfo` to include `isAnglo: boolean`
- Fetch slug per city and apply `isAngloNeighborhood` check

**4. Update `NeighborhoodAutocomplete`** (`src/components/agent/wizard/NeighborhoodAutocomplete.tsx`)
- Same treatment: show anglo tag, sort anglo first

### Visual Treatment
- Anglo neighborhoods get a small `Anglo hub` pill (matching the existing style: `text-[10px] font-medium text-primary/70 bg-primary/8 border border-primary/15 rounded-full px-1.5 py-0.5`)
- Anglo neighborhoods appear at the top of the list, separated by a subtle divider or just sorted first

### Files Modified
1. `src/hooks/useNeighborhoodNames.ts` — add slug fetch, anglo tagging, sorting
2. `src/lib/angloNeighborhoodTags.ts` — no changes needed (already has the utilities)
3. `src/components/filters/NeighborhoodSelector.tsx` — display anglo tags, use new data shape
4. `src/components/agent/wizard/NeighborhoodAutocomplete.tsx` — display anglo tags, sort anglo first

