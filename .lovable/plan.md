
# Clean Up Navigation: Single Consistent Dual-Nav Pattern

## Current State & Issues

| Page | Current Navigation | Problem |
|------|-------------------|---------|
| Property (Buy) | `← Go back · All Listings` | Label should be "All Properties" |
| Property (Rent) | `← Go back · All Listings` | Label should be "All Rentals" |
| Project | `← Go back · All Projects` + Breadcrumb below | Redundant - two navigation rows |

## Solution: Option A Implementation

### 1. PropertyDetail.tsx (Buy/Rent Listings)
**Change**: Update `parentLabel` to be context-aware based on listing status

```tsx
// Before
<DualNavigation
  parentLabel="All Listings"
  parentPath="/listings"
  fallbackPath="/buy"
/>

// After - dynamic label based on listing type
<DualNavigation
  parentLabel={property.listing_status === 'for_rent' ? 'All Rentals' : 'All Properties'}
  parentPath={`/listings?status=${property.listing_status}`}
  fallbackPath={property.listing_status === 'for_rent' ? '/listings?status=for_rent' : '/listings?status=for_sale'}
/>
```

### 2. ProjectDetail.tsx
**Change**: Remove the `ProjectBreadcrumb` component entirely - keep only `DualNavigation`

```tsx
// Remove this line and import:
<ProjectBreadcrumb projectName={project.name} city={project.city} />
```

### 3. ProjectBreadcrumb.tsx (Optional Cleanup)
**Change**: Delete the file if no longer used elsewhere, or keep for potential future use.

## Files to Modify

| File | Action |
|------|--------|
| `src/pages/PropertyDetail.tsx` | Update `parentLabel` and `parentPath` to be listing-status-aware |
| `src/pages/ProjectDetail.tsx` | Remove `ProjectBreadcrumb` import and usage |
| `src/components/project/index.ts` | Remove `ProjectBreadcrumb` export (if present) |
| `src/components/project/ProjectBreadcrumb.tsx` | Delete (or keep for future) |

## Result

After cleanup, all detail pages will have a single, clean navigation row:

```text
Property (For Sale):  ← Go back · All Properties
Property (For Rent):  ← Go back · All Rentals  
Project:              ← Go back · All Projects
```

No duplicate navigation, consistent pattern, context-aware labels.
