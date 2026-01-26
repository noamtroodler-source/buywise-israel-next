
# Fix Ref Warning and Verify Sorting Works Across All Pages

## The Problem

The console shows two React warnings:
```
Warning: Function components cannot be given refs.
Check the render method of `Listings`.
```

These warnings occur because:
1. **ListingsGrid** and **PropertyCard** are function components that don't use `React.forwardRef`
2. React or a parent component is attempting to pass refs to these components
3. The warnings don't break functionality but indicate a code quality issue

## Root Cause Analysis

Looking at the code:

### 1. ListingsGrid (line 15-37)
```tsx
export function ListingsGrid({ children, isFetching, className }: ListingsGridProps) {
  return (
    <div className={cn("relative", className)}>
      ...
    </div>
  );
}
```
- Regular function component, no `forwardRef`

### 2. PropertyCard (line 31 & 527)
```tsx
const PropertyCardComponent = memo(function PropertyCard(...) { ... });
export const PropertyCard = PropertyCardComponent;
```
- Uses `memo` but no `forwardRef`

## The Fix

Wrap both components with `React.forwardRef` to properly handle refs:

### File 1: `src/components/listings/ListingsGrid.tsx`

**Changes:**
- Import `forwardRef` from React
- Wrap component with `forwardRef`
- Accept `ref` parameter and pass to outer div

```tsx
import { ReactNode, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ListingsGridProps {
  children: ReactNode;
  isFetching?: boolean;
  className?: string;
}

export const ListingsGrid = forwardRef<HTMLDivElement, ListingsGridProps>(
  function ListingsGrid({ children, isFetching, className }, ref) {
    return (
      <div ref={ref} className={cn("relative", className)}>
        {/* existing content unchanged */}
      </div>
    );
  }
);
```

### File 2: `src/components/property/PropertyCard.tsx`

**Changes:**
- Import `forwardRef` from React
- Wrap component with `forwardRef` and `memo`
- Accept `ref` parameter and pass to Link wrapper element

```tsx
import { useState, memo, useMemo, useCallback, forwardRef } from 'react';

// ... existing code ...

const PropertyCardComponent = memo(forwardRef<HTMLAnchorElement, PropertyCardProps>(
  function PropertyCard({ property, className, ... }, ref) {
    // ... existing logic ...
    
    return (
      <>
        <Link ref={ref} to={`/property/${property.id}`} onClick={handleCardClick}>
          {/* existing card content */}
        </Link>
      </>
    );
  }
));

export const PropertyCard = PropertyCardComponent;
```

## Sorting Verification

The sorting is already properly implemented in the hooks. Here's the confirmation:

### Properties (`usePaginatedProperties.tsx` lines 183-199)
```tsx
function applySorting(query: any, filters?: PropertyFilters) {
  switch (filters.sort_by) {
    case 'newest': return query.order('created_at', { ascending: false });
    case 'price_asc': return query.order('price', { ascending: true });
    case 'price_desc': return query.order('price', { ascending: false });
    case 'size_desc': return query.order('size_sqm', { ascending: false, nullsFirst: false });
    case 'rooms_desc': return query.order('bedrooms', { ascending: false });
    default: return query.order('created_at', { ascending: false });
  }
}
```

### Projects (`usePaginatedProjects.tsx` lines 119-134)
```tsx
function applySorting(query: any, filters?: ProjectFiltersType) {
  switch (filters.sort_by) {
    case 'price_asc': return query.order('price_from', { ascending: true, nullsFirst: false });
    case 'price_desc': return query.order('price_from', { ascending: false });
    case 'completion': return query.order('completion_date', { ascending: true, nullsFirst: false });
    case 'newest':
    default: return query.order('created_at', { ascending: false });
  }
}
```

All sorting options are correctly mapped and implemented.

## Summary of Changes

| File | Change |
|------|--------|
| `src/components/listings/ListingsGrid.tsx` | Add `forwardRef` wrapper |
| `src/components/property/PropertyCard.tsx` | Add `forwardRef` wrapper with `memo` |

## Result

After these changes:
- No more "Function components cannot be given refs" warnings
- All sorting options will continue to work correctly on Buy, Rent, and Projects pages
- The codebase follows React best practices for ref forwarding
