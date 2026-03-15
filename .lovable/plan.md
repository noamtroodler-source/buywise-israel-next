

# Phase K: CSV Export

## Overview

Add a reusable CSV utility and export buttons to both Agency Listings and Agency Analytics pages, exporting the currently filtered/visible data.

## Changes

### 1. New utility: `src/lib/csvExport.ts`

A generic helper:
- `exportToCSV(filename: string, headers: string[], rows: string[][])` — builds CSV string, creates a Blob, triggers download via a temporary `<a>` element
- Handles escaping (commas, quotes, newlines in cell values)

### 2. Update: `src/pages/agency/AgencyListings.tsx`

- Import `exportToCSV` utility and `FileSpreadsheet` icon
- Add an "Export CSV" button in the header actions row (next to Import/Add Listing)
- On click, export `filteredListings` with columns: Title, Address, City, Price, Type, Status, Agent, Views, Saves, Inquiries, Days on Market, Created

### 3. Update: `src/pages/agency/AgencyAnalytics.tsx`

- Import `exportToCSV` and `FileSpreadsheet` icon
- Add an "Export CSV" button next to the date range selector in the header
- On click, export two sections into one CSV:
  - Summary row: Total Views, Total Saves, Inquiries, Conversion Rate
  - Agent performance rows (if available): Agent Name, Active Listings, Views, Inquiries

## Files touched

| File | Change |
|------|--------|
| `src/lib/csvExport.ts` | New — generic CSV export utility |
| `src/pages/agency/AgencyListings.tsx` | Add export button using filtered data |
| `src/pages/agency/AgencyAnalytics.tsx` | Add export button using analytics data |

