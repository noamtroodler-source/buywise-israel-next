
## Unify Map Filter Bar with Listings Filter Bar

### Goal
Make the map page (`/map`) filter bar visually identical to the grid listings page (`/listings`), replacing the Active/Sold toggle with a Buy/Rent toggle.

### Current Differences

| Feature | Grid Page (`PropertyFilters.tsx`) | Map Page (`MapFiltersBar.tsx`) |
|---------|-----------------------------------|--------------------------------|
| Primary Toggle | Active/Sold (for sale only) | Buy/Rent |
| City Filter | Full dropdown with search | None |
| Price Filter | Full dropdown with range | None (only in dialog) |
| Beds/Baths | Full dropdown | None (only in dialog) |
| Type Filter | Full dropdown | None (only in dialog) |
| More Filters | Full sheet | Dialog-based |
| Sort | Dropdown | None |
| Alert Button | Icon button | None |
| View Toggle | Grid/Map toggle | Grid/Map toggle |

### Solution

Replace `MapFiltersBar` with the existing `PropertyFilters` component, which already has all the filter dropdowns and styling. We'll:

1. **Reuse `PropertyFilters`** - The grid's filter component is feature-complete
2. **Modify the toggle** - Change Active/Sold to Buy/Rent for the map page context
3. **Add Buy/Rent toggle option** - New prop to show Buy/Rent instead of Active/Sold

---

## Technical Changes

### 1. Update `PropertyFilters.tsx` - Add Buy/Rent Toggle Mode

Add a new prop to support Buy/Rent toggle (for map page) vs Active/Sold (for listings):

```typescript
interface PropertyFiltersProps {
  // ... existing props
  showBuyRentToggle?: boolean;  // NEW: Show Buy/Rent instead of Active/Sold
  onBuyRentChange?: (type: 'for_sale' | 'for_rent') => void;  // NEW
}
```

Modify the toggle section (around line 278-304):
- When `showBuyRentToggle` is true, render Buy/Rent toggle
- When `showSoldToggle` is true, render Active/Sold toggle
- Both use the same visual styling

### 2. Update `MapSearchLayout.tsx` - Use PropertyFilters

Replace the custom `MapFiltersBar` component with `PropertyFilters`:

```tsx
// Before
<MapFiltersBar
  filters={filters}
  onFiltersChange={handleFiltersChange}
  listingType={listingStatus}
  resultCount={totalCount}
  isLoading={isFetching}
  ...
/>

// After
<PropertyFilters
  filters={filters}
  onFiltersChange={handleFiltersChange}
  listingType={listingStatus === 'for_rent' ? 'for_rent' : 'for_sale'}
  showBuyRentToggle={true}
  onBuyRentChange={(type) => {
    const params = new URLSearchParams(searchParams);
    params.set('status', type);
    setSearchParams(params);
  }}
  previewCount={totalCount}
  isCountLoading={isFetching}
  onCreateAlert={() => setShowAlertDialog(true)}
/>
```

### 3. Keep MapFiltersBar for Mobile Quick Access

The map page has specific mobile needs (commute filter, quick filters). We'll:
- Use `PropertyFilters` for the main filter bar
- Keep mobile-specific features in a slimmed-down version or integrate into the existing mobile filter sheet

### 4. Handle View Toggle Context

The ViewToggle is already included in PropertyFilters, so it will automatically show Grid/Map options with the correct active state.

---

## Files to Modify

1. **`src/components/filters/PropertyFilters.tsx`**
   - Add `showBuyRentToggle` prop
   - Add `onBuyRentChange` callback
   - Add Buy/Rent toggle rendering logic alongside Active/Sold

2. **`src/components/map-search/MapSearchLayout.tsx`**
   - Import and use `PropertyFilters` instead of `MapFiltersBar`
   - Pass appropriate props for map context

3. **`src/components/map-search/MapFiltersBar.tsx`**
   - Keep only mobile-specific features or remove entirely

---

## Visual Result

After implementation, the map page will have:

```
┌─────────────────────────────────────────────────────────────────┐
│ [Buy|Rent] │ 🏙️ City ▼ │ $ Price ▼ │ 🛏️ Beds ▼ │ Type ▼ │ More │ ... │ Sort ▼ │ 🔔 │ [Grid|Map] │
└─────────────────────────────────────────────────────────────────┘
```

This matches the grid listings page exactly, with the toggle changed to Buy/Rent for the map context.
