

# Phase 4: Productivity Features — CSV Export & Bulk Actions

## 1. CSV Export for Listings

Add an "Export CSV" button to the `AgentProperties.tsx` filter bar that exports the currently filtered listings.

**Changes in `src/pages/agent/AgentProperties.tsx`**:
- Add a `Download` icon import from lucide-react
- Add an `exportToCSV` function that:
  - Takes `filteredListings` and converts to CSV with columns: Title, City, Address, Status, Price, Currency, Views, Days on Market, Created At
  - Creates a Blob and triggers a browser download as `my-listings-YYYY-MM-DD.csv`
- Add an "Export" button next to the "New Listing" button in the header actions area

## 2. Bulk Actions on Listings

Add checkbox-based multi-select with bulk delete and bulk submit-for-review.

**Changes in `src/pages/agent/AgentProperties.tsx`**:
- Add `selectedIds` state (`Set<string>`)
- Add a "select all" checkbox in the table header and per-row checkboxes (desktop) / per-card checkboxes (mobile)
- When `selectedIds.size > 0`, show a floating action bar at the bottom with:
  - "{n} selected" label
  - "Submit for Review" button (only enabled if all selected are draft/changes_requested)
  - "Delete" button with confirmation dialog
  - "Clear Selection" button
- Add `useBulkDeleteProperties` and `useBulkSubmitForReview` functions

**Changes in `src/hooks/useAgentProperties.tsx`**:
- Add `useBulkDeleteProperties()` mutation — loops through IDs calling delete, with optimistic removal from cache
- Add `useBulkSubmitForReview()` mutation — loops through IDs updating status, with optimistic cache update

## 3. CSV Export for Analytics

Add an "Export" button to the `AgentLeads.tsx` header that exports engagement stats.

**Changes in `src/pages/agent/AgentLeads.tsx`**:
- Add `Download` icon import
- Add export button next to the date range selector
- Export function creates CSV from `analytics.propertyEngagement` with columns: Property Title, Views, Saves, WhatsApp Clicks, Email Clicks, Form Clicks

## Files Touched

| File | Action |
|------|--------|
| `src/pages/agent/AgentProperties.tsx` | Add CSV export button, bulk select UI, floating action bar |
| `src/hooks/useAgentProperties.tsx` | Add `useBulkDeleteProperties` and `useBulkSubmitForReview` |
| `src/pages/agent/AgentLeads.tsx` | Add CSV export button for analytics data |

