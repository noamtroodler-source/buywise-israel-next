
# Fix Project Sorting Bug

## Problem Identified

The sorting filters on the Projects page are not working because of a bug in `usePaginatedProjects.tsx`.

### Root Cause
In `usePaginatedProjects.tsx` (lines 101-106), there's a broken filter change detection pattern:

```typescript
// BUG: useState only returns the INITIAL value, it never updates!
const prevFilterKey = useState(filterKey)[0];
if (filterKey !== prevFilterKey) {
  setPage(1);
  setAllProjects([]);
}
```

When you click "Price: Low to High" or any other sort option:
1. The `filters.sort_by` value changes
2. `filterKey` (JSON stringified filters) changes
3. BUT `prevFilterKey` stays at its initial value forever
4. The comparison fails, so the page doesn't reset
5. The query cache returns stale data instead of refetching with new sort order

### Working Pattern (from Properties)
The `usePaginatedProperties.tsx` uses the correct pattern with `useRef` and `useEffect`:

```typescript
const prevFilterKeyRef = useRef(filterKey);
useEffect(() => {
  if (filterKey !== prevFilterKeyRef.current) {
    prevFilterKeyRef.current = filterKey;
    setPage(1);
    setAllProperties([]);
  }
}, [filterKey]);
```

## The Fix

Update `src/hooks/usePaginatedProjects.tsx` to use the same working pattern as properties:

### Changes to Make

**File: `src/hooks/usePaginatedProjects.tsx`**

1. Add `useEffect` and `useRef` to imports (line 1)
2. Replace the broken filter detection logic (lines 101-106) with the working pattern

**Before (broken):**
```typescript
import { useState, useCallback, useMemo } from 'react';

// ... later in the hook ...

// Reset page when filters change
const prevFilterKey = useState(filterKey)[0];
if (filterKey !== prevFilterKey) {
  setPage(1);
  setAllProjects([]);
}
```

**After (fixed):**
```typescript
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';

// ... later in the hook ...

// Reset page when filters change
const prevFilterKeyRef = useRef(filterKey);
useEffect(() => {
  if (filterKey !== prevFilterKeyRef.current) {
    prevFilterKeyRef.current = filterKey;
    setPage(1);
    setAllProjects([]);
  }
}, [filterKey]);
```

## Summary

| File | Change |
|------|--------|
| `src/hooks/usePaginatedProjects.tsx` | Fix filter change detection using useRef + useEffect pattern |

## Result After Fix

- "Newest First" will show projects ordered by creation date (newest first)
- "Price: Low to High" will show projects ordered by ascending price
- "Price: High to Low" will show projects ordered by descending price  
- "Completion Date" will show projects ordered by earliest completion date first
- The fix matches the working pattern already used in the Properties/Rentals pages
