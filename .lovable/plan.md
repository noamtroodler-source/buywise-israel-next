
# Update RegionExplorer Section Header

## Summary

Replace the "Explore by Region" section header with new copy.

---

## Text Changes

| Element | Current | New |
|---------|---------|-----|
| Title (h2) | "Explore by Region" | "Explore Real Estate Markets Across Israel" |
| Subtitle (p) | "Discover cities across Israel" | "Market context and buyer-focused insights for each city." |

---

## Implementation

**File:** `src/components/home/RegionExplorer.tsx`

### Lines 84-89: Update the header text

```tsx
<h2 className="text-2xl md:text-4xl font-bold text-foreground">
  Explore Real Estate Markets Across Israel
</h2>
<p className="text-base text-muted-foreground mt-1">
  Market context and buyer-focused insights for each city.
</p>
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/home/RegionExplorer.tsx` | Update h2 title and subtitle paragraph |
