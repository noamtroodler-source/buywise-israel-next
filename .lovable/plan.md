
# Upgrade "At a Glance" to "Amenities & Features" Section

## Current State

The property detail page has a small, understated section:

```text
Current:
┌─────────────────────────────────────────────────────┐
│ At a Glance                      <- text-sm, gray   │
│ [Spacious Layout] [Double Parking] [Renovated]      │
└─────────────────────────────────────────────────────┘
```

## Target State

Match the project page's prominent section styling:

```text
After:
┌─────────────────────────────────────────────────────┐
│ ✨ Amenities & Features          <- text-lg, bold   │
│ [Spacious Layout] [Double Parking] [Renovated]      │
└─────────────────────────────────────────────────────┘
```

## Visual Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Title | "At a Glance" | "Amenities & Features" |
| Size | `text-sm` | `text-lg` |
| Weight | `font-medium` | `font-semibold` |
| Color | `text-muted-foreground` (gray) | `text-foreground` (default/black) |
| Icon | None | Sparkles icon with `text-primary` |

## Files to Modify

| File | Change |
|------|--------|
| `src/components/property/PropertyQuickSummary.tsx` | Update heading style from small gray to prominent section header with Sparkles icon |

## Technical Changes

In `PropertyQuickSummary.tsx`, lines 471-472, change from:

```tsx
<h3 className="text-sm font-medium text-muted-foreground">At a Glance</h3>
```

To:

```tsx
<h3 className="text-lg font-semibold flex items-center gap-2">
  <Sparkles className="h-5 w-5 text-primary" />
  Amenities & Features
</h3>
```

Note: The Sparkles icon is already imported in this file (line 5), so no new imports are needed.

## Impact

This change affects both property buy and rental detail pages since they share the same `PropertyQuickSummary` component. The highlights/features will now have the visual prominence they deserve, matching the project page's treatment of amenities.
