
# Plan: Add Social Links Display to Agency Public Profile

## Overview
Agencies can already save social links (LinkedIn, Instagram, Facebook) through their settings page, but these links aren't displayed on their public profile page. This plan adds social link icons to the agency detail page, matching the pattern already used on developer profiles.

## Changes Required

### 1. Update Agency Interface
**File:** `src/hooks/useAgency.tsx`

Add `social_links` to the Agency interface:
```typescript
export interface Agency {
  // ... existing fields
  social_links?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
  } | null;
}
```

### 2. Update Agency Detail Page
**File:** `src/pages/AgencyDetail.tsx`

Add social link icon buttons next to the existing contact buttons in the hero card, following the same pattern used in `DeveloperDetail.tsx`:

- Import Linkedin, Instagram, Facebook icons from lucide-react
- Add a visual separator between contact buttons and social icons
- Display social link icon buttons (ghost variant, icon-only) for any links that exist

**Location in UI:** After the Share button in the contact actions row

**Visual treatment:**
- Small ghost icon buttons (h-8 w-8)
- Opens in new tab with proper rel attributes
- Only shows icons that have URLs configured

## Visual Example
```
[Website] [Call] [Email] [Share] | [LinkedIn] [Instagram] [Facebook]
                                   ↑ Only shows if configured
```

## No Database Changes Required
The `social_links` column already exists in the agencies table and agencies can already save their social links through settings.

## Files to Modify
1. `src/hooks/useAgency.tsx` - Add social_links to interface
2. `src/pages/AgencyDetail.tsx` - Display social link icons
