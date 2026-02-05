
# Align Project Filters with Property Filters Styling

## Problem
The project filters use `accent` color (yellow/amber vibes) for active/selected states, while the rental and buy filters use `primary` color (blue). This creates visual inconsistency.

## Current vs Target

| Component | Current Active Style | Target Active Style |
|-----------|---------------------|---------------------|
| **ProjectFilters** | `bg-accent/20 border-accent/40 text-foreground` | `bg-primary text-primary-foreground border-primary` |
| **PropertyFilters** | `bg-primary text-primary-foreground border-primary` | (already correct) |

## Change

**File**: `src/components/filters/ProjectFilters.tsx`

**Line 169** - Update `filterButtonActive` constant:
```typescript
// Before
const filterButtonActive = "bg-accent/20 border-accent/40 text-foreground";

// After  
const filterButtonActive = "bg-primary text-primary-foreground border-primary";
```

This single change will make the project filters use the same blue color scheme as the rental/buy filters for:
- City dropdown button (when open or has selection)
- Status dropdown button
- Beds/Baths dropdown button
- Price dropdown button
- Year dropdown button
- Developer dropdown button
- Sort dropdown button

No other changes needed.
