
# Add Dotted Underline + Help Cursor to Quick Facts Tooltips

## What We're Changing

The Quick Facts Grid in `PropertyQuickSummary.tsx` already has tooltips on some items (Year Built, Floor, Parking, Entry Date, A/C Type), but there's no visual signal that they're hoverable. We'll apply the same pattern used in `GlossaryTooltip` and `RecentNearbySales`:

**Visual Changes:**
- Add `border-b border-dotted border-muted-foreground/30` to the **label text** (the "Built", "Floor", etc.)
- Keep the existing `cursor-help` on the container

This creates a clean, consistent pattern across the app where dotted-underlined text = "hover me for more info."

## File to Update

**`src/components/property/PropertyQuickSummary.tsx`**

### Changes to Make

For each Quick Facts item that has a tooltip, update the label `<p>` element:

| Line | Current Label | Updated Label |
|------|---------------|---------------|
| 360 | `<p className="text-xs text-muted-foreground">Built</p>` | `<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Built</p>` |
| 377 | `<p className="text-xs text-muted-foreground">Floor</p>` | `<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Floor</p>` |
| 416 | `<p className="text-xs text-muted-foreground">Parking</p>` | `<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Parking</p>` |
| 441 | `<p className="text-xs text-muted-foreground">Available</p>` | `<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Available</p>` |
| 458 | `<p className="text-xs text-muted-foreground">A/C</p>` | `<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">A/C</p>` |

### Items WITHOUT Tooltips (no changes)
These don't have tooltips, so they keep their current styling:
- Price/sqm (line 393)
- Lot Size (line 404)  
- Condition (line 430)

## Visual Result

**Before:**
- Labels look like regular text, no indication they're interactive
- Only the cursor changes on hover

**After:**
- Labels with tooltips have a subtle dotted underline
- Users immediately see "this has more info"
- Matches the existing GlossaryTooltip and mortgage estimate patterns

## Code Pattern

```tsx
// Current (no visual signal):
<p className="text-xs text-muted-foreground">Built</p>

// Updated (dotted underline signals interactivity):
<p className="text-xs text-muted-foreground border-b border-dotted border-muted-foreground/30">Built</p>
```

## Files Changed
- `src/components/property/PropertyQuickSummary.tsx` - Add dotted underline to 5 tooltip labels
