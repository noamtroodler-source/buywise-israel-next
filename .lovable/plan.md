

# Phase 6.5: Review UI Enhancements

Implementing the remaining items from Section 11 of the blueprint that are not yet built.

## What's missing (from blueprint Section 11)

| Blueprint Requirement | Current Status |
|---|---|
| Field-by-field confidence indicators (green/yellow/red dots) | Not implemented |
| "Skip All Low Confidence" bulk action | Not implemented |
| Duplicate warnings with "Merge" option | Partial (shows warning, no merge) |
| Photo reordering via drag and drop | Not implemented |
| Quick filters: "Missing photos", "Low confidence", "Potential duplicates" | Not implemented |
| Source preview (iframe) | Not implemented (just a link) |

## Changes

### 1. Enhanced `ImportReviewCard.tsx`

**Field-level confidence dots**: Add colored dots (green/yellow/red) next to each parsed field based on simple heuristics:
- Price: green if numeric & in range, yellow if numeric but unusual, red if missing
- Rooms: green if 1-10, yellow if >10, red if missing
- Size: green if reasonable for room count, red if missing
- City: green if present, red if missing
- Address: green if has street+number, yellow if street only, red if missing
- Photos: green if 3+, yellow if 1-2, red if 0

**Photo gallery + reorder**: Show extracted photos as a thumbnail grid. Add drag-and-drop reorder using native HTML drag events (no extra library needed). Store reordered array in `editData.image_urls`.

**Source preview**: Add a collapsible iframe showing the source URL below the source link (with sandbox restrictions for safety). Toggle button "Preview Source Page".

### 2. Enhanced `AgencyImportReview.tsx`

**Additional quick filter tabs**: Extend filter from 4 to 7 options:
- Keep: All, Pending, Approved, Failed
- Add: "Low Confidence" (score < 60), "Missing Photos" (0 photos), "Duplicates" (has `cross_source_match_id`)

**"Skip All Low Confidence" button**: Bulk action alongside existing "Approve All High Confidence" — skips items with score < 40.

**Skip item action**: Add a `useSkipItem` hook or use existing mutation to mark items as "skipped" via the edge function.

### 3. New skip action in `useImportListings.tsx`

Add `useSkipItem` mutation that updates `import_job_items` status to `skipped` directly via the Supabase client (no edge function needed).

## Files to create/edit
- **Edit**: `src/components/agency/ImportReviewCard.tsx` — field confidence dots, photo grid with drag reorder, source iframe preview
- **Edit**: `src/pages/agency/AgencyImportReview.tsx` — additional quick filters, skip bulk action, skip item support
- **Edit**: `src/hooks/useImportListings.tsx` — add `useSkipItem` mutation

## No database changes needed

