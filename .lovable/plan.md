

# Report Inaccurate Info Feature

## Overview
Add a "Report Inaccurate Info" link to property detail pages, allowing users to flag outdated or incorrect listing information. This is a community-driven data quality feature used by Zillow, Redfin, and others.

## Implementation

### 1. Create Database Table: `listing_reports`
Store user-submitted reports for admin review.

```sql
CREATE TABLE public.listing_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT, -- For anonymous reports
  report_type TEXT NOT NULL, -- 'sold', 'price_wrong', 'photos_wrong', 'already_rented', 'scam', 'other'
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved', 'dismissed'
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  
  CONSTRAINT check_entity CHECK (
    (property_id IS NOT NULL AND project_id IS NULL) OR
    (property_id IS NULL AND project_id IS NOT NULL)
  )
);

-- RLS: Anyone can create reports, only admins can read/update
ALTER TABLE public.listing_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reports" ON listing_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own reports" ON listing_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reports" ON listing_reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
```

### 2. Create Component: `ReportListingButton`
**File:** `src/components/property/ReportListingButton.tsx`

A subtle link/button that opens a dialog with:
- **Report type dropdown**: "Already sold/rented", "Price is wrong", "Photos don't match", "Possible scam", "Other"
- **Optional description** textarea
- **Email field** (if not logged in)
- Submit button

Design: Small, muted link at bottom of property info (not prominent but accessible)

```text
[Flag Icon] Report inaccurate info
```

### 3. Create Dialog: `ReportListingDialog`
**File:** `src/components/property/ReportListingDialog.tsx`

Modal dialog with:
- Radio buttons for report type
- Optional description field
- Email field (shown only if user not logged in)
- Success confirmation with "Thank you for helping keep our listings accurate"

### 4. Create Hook: `useReportListing`
**File:** `src/hooks/useReportListing.ts`

```typescript
export function useReportListing() {
  // Submit report to listing_reports table
  // Show toast on success
}
```

### 5. Add to Property Detail Page
**File:** `src/pages/PropertyDetail.tsx`

Add `ReportListingButton` after the ListingFeedback component (subtle placement near bottom of listing content).

### 6. Add to Project Detail Page (optional)
**File:** `src/pages/ProjectDetail.tsx`

Same treatment for new development projects.

## UI Placement

```text
Property Detail Page
├── Hero
├── Quick Summary
├── Description
├── Value Snapshot
├── Recent Sales
├── Questions to Ask
├── Cost Breakdown
├── Location
├── Next Steps
├── Listing Feedback
└── [Flag] Report inaccurate info  <-- NEW (subtle link)
```

## Report Types
| Type | Label |
|------|-------|
| `sold` | Already sold |
| `rented` | Already rented |
| `price_wrong` | Price is incorrect |
| `photos_wrong` | Photos don't match |
| `info_outdated` | Information is outdated |
| `scam` | Possible scam/fraud |
| `other` | Other issue |

## Files to Create/Modify

| File | Action |
|------|--------|
| Database migration | Create `listing_reports` table |
| `src/components/property/ReportListingButton.tsx` | Create |
| `src/components/property/ReportListingDialog.tsx` | Create |
| `src/hooks/useReportListing.ts` | Create |
| `src/pages/PropertyDetail.tsx` | Modify (add button) |
| `src/pages/ProjectDetail.tsx` | Modify (add button - optional) |

## Success State
After submitting, user sees:
- Toast: "Thanks for reporting! We'll review this listing."
- Dialog closes
- No page refresh needed

