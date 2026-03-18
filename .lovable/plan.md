

## Fix: Boosted Listings Priority Over Legacy `is_featured`

### Problem
On line 465, boosted (agency-paid) properties are appended **after** admin/legacy properties: `[...adminProperties, ...boostedProperties].slice(0, 8)`. If there are 8+ admin properties, boosted ones get cut off.

### Fix
Reverse the merge order on both sale (line 413) and rent (line 465) surfaces so boosted listings appear first:

**`src/hooks/useProperties.tsx`** — two changes:

1. **Line 413** (sale): Change to `[...boostedProperties, ...adminProperties].slice(0, 8)`
2. **Line 465** (rent): Change to `[...boostedProperties, ...adminProperties].slice(0, 8)`

This ensures agency-paid boosted listings always get priority placement, with admin-curated/legacy properties filling remaining slots. The session-based shuffle still applies within the boosted set for fairness across agencies.

No database changes needed.

