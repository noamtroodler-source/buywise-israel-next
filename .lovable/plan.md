

# Import Listings: Onboarding-First Positioning

## Overview
Reposition the Import Listings feature as a **one-time onboarding accelerator** rather than a regular feature. Three changes:

1. **Dashboard welcome banner** — A prominent, one-time CTA for new agencies with zero listings to import from their website. Disappears after first import or manual dismiss.
2. **"Already have listings" nudge on the import page** — When an agency already has listings, show a gentle message steering them toward manual listing creation instead.
3. **Move Import out of primary nav** — Demote the "Import" button from the dashboard header row into the Settings page or a less prominent location.

## Changes

### 1. New Component: `ImportWelcomeBanner`
A new component rendered on the Agency Dashboard, shown only when:
- The agency has **0 active listings** (from `stats.activeListings`)
- The banner hasn't been dismissed (tracked via `localStorage` key `agency_import_banner_dismissed`)
- No completed import jobs exist (optional extra check)

The banner will display:
- Heading: "Get started quickly"
- Body: "Import your existing listings from your website in minutes"
- Two actions: **[Import from Website]** (links to `/agency/import`) and **[Skip - I'll add manually]** (dismisses)
- Styled consistently with the existing `AgencyOnboardingProgress` card (gradient border, rounded-2xl)

Once dismissed or after the first import job completes, it never shows again.

### 2. Import Page: "Already have listings" nudge
On `AgencyImport.tsx`, add an info banner (using the existing `InfoBanner` component) at the top when `stats.activeListings > 0`:

> "You already have X listings. This tool is designed for first-time bulk imports. For new individual listings, the **Add Listing** wizard gives you more control and better accuracy."

This is a soft nudge, not a block — they can still use the import tool.

### 3. Move Import button in dashboard header
Remove the "Import" button from the dashboard's top nav button row (line 191-195 in `AgencyDashboard.tsx`). Instead, the import page will be accessible via:
- The welcome banner (for new agencies)
- The onboarding checklist (already has a "First listing published" item)
- Direct URL `/agency/import` (for those who know about it)
- A link in Settings or at the bottom of the Listings page

## Technical Details

### New file: `src/components/agency/ImportWelcomeBanner.tsx`
- Accepts `activeListings: number` and optional `hasCompletedImport: boolean`
- Uses `localStorage` key `agency_import_banner_dismissed` for persistence
- Renders a card with gradient styling, two buttons, and an animated collapse on dismiss

### Modified file: `src/pages/agency/AgencyDashboard.tsx`
- Import and render `ImportWelcomeBanner` above the stats cards (or just below the onboarding checklist)
- Remove the "Import" button from the header button row
- Pass `stats?.activeListings` to the banner

### Modified file: `src/pages/agency/AgencyImport.tsx`
- Add a query for listing count (reuse `useAgencyStats` or similar)
- When `activeListings > 0`, show an `InfoBanner` with the nudge message between the header and the discovery form

### Modified file: `src/hooks/useImportListings.tsx`
- No changes needed (existing hooks are sufficient)

