

# Fix Neighborhood List Cut-off: Divider + Row-Snapped Height

Two changes:

## 1. NeighborhoodSelector.tsx
- Change `max-h-[120px]` to `max-h-[168px]` — each row is ~28px (py-1.5 + text-sm = ~28px), so 6 rows × 28px = 168px, ensuring it always cuts between items
- Add `border-b pb-2 mb-1` to the outer wrapper so there's a clear divider between neighborhoods and the cities section below

## 2. PropertyFilters.tsx
- Remove the standalone `<Label className="text-sm font-medium">Cities</Label>` (line 526) since the divider from the NeighborhoodSelector now provides visual separation — or keep the label but remove extra spacing since the border handles it

### Files to modify
- `src/components/filters/NeighborhoodSelector.tsx` — line 54: `max-h-[120px]` → `max-h-[168px]`; line 41: add bottom border to wrapper div
- `src/components/filters/MobileFilterSheet.tsx` — same pattern if it renders NeighborhoodSelector similarly

