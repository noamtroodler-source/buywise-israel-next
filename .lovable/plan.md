

# Phase 17: Review UI Enhancements

## Current State
Most of the described features **already exist**:
- ✅ Bulk "Approve All High Confidence (80+)" button
- ✅ Bulk "Skip All Low Confidence (<40)" button
- ✅ Quick filters: "No Photos", "Low Confidence", "Duplicates" tabs
- ✅ Cross-source duplicate warning banner in ImportReviewCard

## What's Missing

### 1. "Needs Attention" filter tab
A combined filter showing items that need human review: low confidence (<60) OR no photos OR has duplicate OR has validation warnings. Added as a new tab in `AgencyImportReview.tsx`.

### 2. Inline merge option for duplicates in ImportReviewCard
Currently the duplicate warning just shows a property ID. Enhance it to:
- Fetch the matched property's details (title, city, price, bedrooms, image) via a query
- Show a mini side-by-side comparison inline
- Add "Merge" and "Not a Duplicate" buttons that call `merge_properties` RPC / update `duplicate_pairs`
- Only show for items with status `done` (already approved, so they have a `property_id`)

### 3. Confirmation dialog for bulk actions
Add a confirmation dialog before bulk approve/skip to prevent accidental mass actions.

## Files to Edit

### `src/pages/agency/AgencyImportReview.tsx`
- Add `'needs_attention'` to `FilterTab` type
- Add `needs_attention` count and filter logic (low confidence OR no photos OR duplicates OR has warnings)
- Add tab trigger with AlertTriangle icon
- Add confirmation dialogs for bulk approve/skip buttons

### `src/components/agency/ImportReviewCard.tsx`
- Add `onMergeDuplicate` and `onDismissDuplicate` callback props
- When `cross_source_match_id` exists AND item has a `property_id` (approved):
  - Fetch matched property details using a `useQuery` inside the component
  - Show mini comparison card with key fields (title, city, price, bedrooms, size, lead image)
  - Add "Keep This / Keep Other" merge buttons and "Not a Duplicate" dismiss button

### `src/pages/agency/AgencyImportReview.tsx` (merge handling)
- Add `useMutation` for `merge_properties` RPC (same pattern as AdminDuplicates)
- Add `useMutation` to dismiss duplicate pairs
- Pass merge/dismiss handlers to ImportReviewCard
- Import `useAuth` for admin_id parameter

