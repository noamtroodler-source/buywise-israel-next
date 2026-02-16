
# Simplify Map Toggle: Remove "New" Button

## What Changes

The map search toggle currently shows **Buy | Rent | New**. We'll simplify it to **Buy | Rent**, since projects are already included in the "Buy" view (they show as blue markers alongside resale properties).

No data-fetching logic changes needed -- the code already fetches projects when `status === 'for_sale'`.

## Changes

### 1. Desktop Toggle (`src/components/filters/PropertyFilters.tsx`)
- Remove the third "New" button from the Buy/Rent/New toggle (lines 395-405)
- The toggle becomes just Buy and Rent

### 2. Mobile Toggle (`src/components/map-search/MobileMapFilterBar.tsx`)
- Already only shows Buy and Rent -- no change needed

### 3. Cleanup (`src/components/map-search/MapSearchLayout.tsx`)
- Remove the `handleStatusChange` callback (which accepted `'projects'` as a type) and use `handleBuyRentChange` for the desktop toggle instead
- Remove `isProjectsOnly` logic since users can no longer select projects-only mode via the toggle
- Keep the `shouldFetchProjects` logic (projects still load when status is `for_sale`)

## What Stays the Same
- Projects still appear as blue markers on the map when "Buy" is selected
- Project cards still appear in the list panel interleaved with resale properties
- All project filtering and sorting continues to work
- Direct URL access with `?status=projects` still works as a fallback
