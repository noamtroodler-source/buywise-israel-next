

# Phase I: Bulk Actions for Agency Listings

## Overview

Add multi-select checkboxes to the agency listings table with a floating action bar for bulk delete, bulk submit for review, and bulk reassign — mirroring the existing pattern in `AgentProperties.tsx`.

## Changes

### `src/pages/agency/AgencyListings.tsx`

1. **New state & hooks**:
   - Add `selectedIds: Set<string>` state
   - Add `showBulkDeleteConfirm` state
   - Import `Checkbox` from `@/components/ui/checkbox`
   - Import `useBulkDeleteProperties`, `useBulkSubmitForReview`, `useReassignProperty` from hooks
   - Import `AnimatePresence` from framer-motion, `X` icon, `Card/CardContent` (already imported)

2. **Selection helpers** (same pattern as AgentProperties):
   - `toggleSelect(id)` — add/remove from set
   - `toggleSelectAll()` — select all filtered or clear
   - `allSelectedCanSubmit` memo — true when all selected have `draft` or `changes_requested` status

3. **Table changes**:
   - Add a new `<TableHead>` with a select-all `<Checkbox>` as the first column
   - Add a `<TableCell>` with per-row `<Checkbox>` as the first cell in each row
   - Highlight selected rows with `bg-primary/5`

4. **Floating Bulk Action Bar** (rendered after the table card, inside `AnimatePresence`):
   - Shows when `selectedIds.size > 0`
   - Displays: `{n} selected`
   - **Submit for Review** button (conditionally shown when `allSelectedCanSubmit`)
   - **Bulk Reassign** — a dropdown/popover to pick a target agent, then calls `useReassignProperty` for each selected property
   - **Delete** button → opens inline `AlertDialog` confirmation
   - **Clear selection** (X) button

5. **Bulk reassign implementation**: Use a `Select` dropdown in the floating bar listing team members. On selection, iterate through `selectedIds` calling `reassignProperty.mutate` for each, then clear selection on completion.

## Files touched

| File | Change |
|------|--------|
| `src/pages/agency/AgencyListings.tsx` | Add checkboxes, selection state, floating bulk action bar with delete/submit/reassign |

Single file change. All hooks (`useBulkDeleteProperties`, `useBulkSubmitForReview`, `useReassignProperty`) already exist.

