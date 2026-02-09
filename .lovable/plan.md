

## Phase 2: Desktop Layout Polish

This phase streamlines the desktop map filter bar and enriches the property list panel header with sort, city context, and a Create Alert button.

---

### 2.1 Add `mapMode` prop to PropertyFilters

**File: `src/components/filters/PropertyFilters.tsx`**

- Add a new optional prop `mapMode?: boolean` to the interface (defaults to `false`)
- When `mapMode` is true on desktop:
  - **Hide the Sort dropdown** from the right-side group (lines ~781-815) -- sorting will move to the list panel header
  - **Hide the Create Alert bell button** from the right-side group (lines ~818-830) -- it moves to the list panel header
  - **Replace the ViewToggle import** with a small "Switch to Grid" icon-only button (LayoutGrid icon) that navigates to `/listings` preserving current URL params
  - Keep the `ml-auto` right-side group but it will only contain: Clear Filters button + Switch to Grid icon button
- Remove the unused `ViewToggle` import (it's imported but never rendered)

### 2.2 Enrich MapPropertyList header

**File: `src/components/map-search/MapPropertyList.tsx`**

- Accept new props:
  - `cityName?: string` -- to show "in [City]" context
  - `sortBy?: SortOption` -- current sort value
  - `onSortChange?: (sort: SortOption) => void` -- callback
  - `onCreateAlert?: () => void` -- callback for the alert button
- Replace the plain header (`"X properties"`) with a richer layout:
  - Left side: **"X properties"** + **"in [City Name]"** (if city is set, shown in muted text)
  - Right side: **Sort dropdown** (ArrowUpDown icon + label, opens a Popover with the same SORT_OPTIONS) + **Create Alert** icon button (Bell icon, rounded, primary style)
- The sort options list: `Newest Listings`, `Price: Low to High`, `Price: High to Low`, `Largest First`, `Rooms: Most to Fewest` (same as existing)

### 2.3 Wire up new props in MapSearchLayout

**File: `src/components/map-search/MapSearchLayout.tsx`**

- Pass `mapMode={true}` to the `PropertyFilters` component in the desktop layout (line ~560)
- Pass new props to `MapPropertyList`:
  - `cityName={filters.city}`
  - `sortBy={filters.sort_by}`
  - `onSortChange={(sort) => handleFiltersChange({ ...filters, sort_by: sort })}`
  - `onCreateAlert={() => setShowAlertDialog(true)}`

### 2.4 Responsive grid adjustment

**File: `src/components/map-search/MapPropertyList.tsx`**

- When the list panel is narrow (the 45% panel on a smaller screen), the 2-column grid can produce cramped cards. Add a container query or a simple min-width check:
  - Use a `ResizeObserver` via a `useEffect` on the list container to track its width
  - If width < 420px, switch from `grid-cols-2` to `grid-cols-1`
  - This ensures cards remain readable even when the user drags the panel smaller

---

### Summary of changes

| File | What changes |
|------|-------------|
| `PropertyFilters.tsx` | Add `mapMode` prop; hide Sort and Create Alert when `mapMode=true`; add "Switch to Grid" icon button; remove unused ViewToggle import |
| `MapPropertyList.tsx` | Add city context, sort dropdown, and Create Alert button to header; add responsive column switching with ResizeObserver |
| `MapSearchLayout.tsx` | Pass `mapMode`, `cityName`, `sortBy`, `onSortChange`, `onCreateAlert` props |

