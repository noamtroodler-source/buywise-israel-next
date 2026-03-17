

# Simplify Import Flow: Auto-Draft with Wizard Editing

## Current State

The import pipeline **already** auto-creates properties as drafts (`verification_status: "draft"`, `is_published: false`) in `processOneItem`. The `AgencyImportReview` page with 8 filter tabs, bulk approve/skip, confidence indicators, and per-item review cards is redundant — everything that passes validation is already a draft property.

## What Changes

### 1. Replace `AgencyImportReview` page with a simple summary

Strip the 330-line review page down to a compact summary dashboard:
- **Stats bar**: X imported as drafts, Y skipped, Z failed (with error reasons)
- **"Go to Listings" button** — primary CTA pointing to `/agency/listings` 
- **Failed items table** — simple list showing URL + error reason (collapsible)
- Remove: filter tabs, ImportReviewCard, bulk approve/skip, confidence indicators, duplicate merge UI

### 2. Simplify the Import page action buttons

In `AgencyImport.tsx`, replace the "Review Imported" button with "View Drafts in Listings" as the primary post-import action. Remove the separate review link.

Current buttons after import:
- Review Imported (X) → goes to complex review page
- View Drafts → goes to listings

Replace with:
- **View Imported Drafts** → goes to `/agency/listings` (primary)
- Keep failed/retry buttons as-is

### 3. Add "Imported" badge to Agency Listings table

In `AgencyListings.tsx`, show a small "Imported" badge on listings where `import_source` is set (non-null). This helps agency owners identify which drafts came from the import tool vs. manually created.

### 4. Remove `ImportReviewCard` component

Delete `src/components/agency/ImportReviewCard.tsx` — no longer needed since users edit drafts through the existing property wizard.

### 5. Remove `useApproveItem` hook usage

The `approve_item` edge function action and `useApproveItem` hook become unused from the UI. Keep the edge function action for potential API use but remove client-side imports.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/agency/AgencyImportReview.tsx` | Rewrite to simple summary page |
| `src/pages/agency/AgencyImport.tsx` | Simplify post-import buttons |
| `src/pages/agency/AgencyListings.tsx` | Add "Imported" badge for `import_source` properties |
| `src/components/agency/ImportReviewCard.tsx` | Delete |

## Result

Agency owners: Discover → Process All → Go to Listings → Edit any draft via the existing property wizard. No more overwhelming review UI.

